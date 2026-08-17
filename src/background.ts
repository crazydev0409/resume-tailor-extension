import { tailorResume as tailorResumeAPI } from "@/services/openai";
import { insertGenerationRecord } from "@/services/supabaseHistory";

// ── Background service worker for AI Resume Tailor ──
// Architecture:
//   - Background owns ALL state (working/done lists, settings).
//   - Popup is a pure display layer — reads via GET_STATE + storage.onChanged.
//   - chrome.alarms keeps the service worker alive during long API calls.
//   - All tailoring flows go through startTailoring(), which is always awaited.

const KEEPALIVE_ALARM = "keepalive";
const STALE_CHECK_ALARM = "stale-check";
const DEFAULT_MODEL = "deepseek-v4-pro";
const DEFAULT_API_URL = "https://api.deepseek.com";

function normalizeApiKey(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, "").replace(/\s+/g, "");
}

// ── Context menu ──

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "tailor-my-resume",
    title: "Tailor My Resume",
    contexts: ["selection"],
  });
  // Also recover stale items on install/update
  recoverStaleItems();
});

// ── On startup: recover stale "tailoring" items ──
chrome.runtime.onStartup.addListener(() => {
  recoverStaleItems();
});

// ── Alarm handlers: keepalive + stale recovery ──

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    // Just touching a Chrome API keeps the worker alive.
    // Also check if we still need the keepalive.
    checkKeepaliveNeeded();
  }
  if (alarm.name === STALE_CHECK_ALARM) {
    recoverStaleItems();
  }
});

async function startKeepalive() {
  // Fire every 25 seconds to prevent the 30-second idle timeout
  await chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 25 / 60 });
}

async function stopKeepalive() {
  await chrome.alarms.clear(KEEPALIVE_ALARM);
}

async function checkKeepaliveNeeded() {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  const active = workingItems.filter((i: WorkingItem) => i.status === "tailoring");
  if (active.length === 0) {
    await stopKeepalive();
  }
}

async function recoverStaleItems() {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  const stale = workingItems.filter((i: WorkingItem) => i.status === "tailoring");
  if (stale.length > 0) {
    // Items older than 5 minutes are considered stale
    const FIVE_MIN = 5 * 60 * 1000;
    const now = Date.now();
    let hasStale = false;
    const updated = workingItems.map((i: WorkingItem) => {
      if (i.status === "tailoring" && now - i.timestamp > FIVE_MIN) {
        hasStale = true;
        return { ...i, status: "failed" as const, error: "Interrupted — please retry" };
      }
      return i;
    });
    if (hasStale) {
      await setStorage({ workingItems: updated });
      updateBadge();
    }
  }
}

// ── Helpers: storage read/write ──

async function getStorage<K extends string>(keys: K[]): Promise<Record<K, any>> {
  return new Promise((resolve) => chrome.storage.local.get(keys, (r) => resolve(r as any)));
}

async function setStorage(data: Record<string, any>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

// ── Helpers: working / done list manipulation ──

interface WorkingItem {
  id: string;
  timestamp: number;
  jobDescription: string;
  sourceUrl: string;
  sourceTitle: string;
  status: "tailoring" | "failed";
  error?: string;
}

interface DoneItem {
  id: string;
  timestamp: number;
  companyName: string;
  role: string;
  jobDescription: string;
  originalResume: string;
  tailoredResume: string;
  model: string;
  apiUrl: string;
  sourceUrl: string;
  note?: string;
  link?: string;
  pinned: boolean;
  keywords?: {
    hardSkillsOnResume: string[];
    hardSkillsOnJD: string[];
    toolsAndTechnologiesOnResume: string[];
    toolsAndTechnologiesOnJD: string[];
  };
}

async function addWorkingItem(item: WorkingItem) {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  await setStorage({ workingItems: [item, ...workingItems] });
  updateBadge();
}

async function removeWorkingItem(id: string) {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  await setStorage({ workingItems: workingItems.filter((i: WorkingItem) => i.id !== id) });
  updateBadge();
}

async function markWorkingFailed(id: string, error: string) {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  const updated = workingItems.map((i: WorkingItem) =>
    i.id === id ? { ...i, status: "failed" as const, error } : i
  );
  await setStorage({ workingItems: updated });
  updateBadge();
}

async function addDoneItem(item: DoneItem) {
  const { doneItems = [] } = await getStorage(["doneItems"]);
  await setStorage({ doneItems: [item, ...doneItems] });
}

// ── Cloud archive: permanent log of every successful generation. ──
// Opt-in (no-ops until Settings > Database is configured) and never blocks
// or fails the local save — it only logs a warning + soft toast on failure.
async function saveToCloud(item: DoneItem) {
  const { supabaseUrl = "", supabaseAnonKey = "" } = await getStorage([
    "supabaseUrl",
    "supabaseAnonKey",
  ]);
  try {
    await insertGenerationRecord({ url: supabaseUrl, anonKey: supabaseAnonKey }, item);
  } catch (err: any) {
    console.warn("Cloud archive save failed:", err);
    if (supabaseUrl && supabaseAnonKey) {
      broadcast({
        type: "ERROR",
        message: "Saved locally, but cloud archive failed. Check Settings > Database.",
      });
    }
  }
}

async function updateBadge() {
  const { workingItems = [] } = await getStorage(["workingItems"]);
  const active = workingItems.filter((i: WorkingItem) => i.status === "tailoring").length;
  if (active > 0) {
    chrome.action.setBadgeText({ text: String(active) });
    chrome.action.setBadgeBackgroundColor({ color: "#F59E0B" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

function broadcast(message: any) {
  chrome.runtime.sendMessage(message).catch(() => {
    /* popup closed – that's fine */
  });
}

// ── Core: tailor resume via shared API service ──

// ── Handler: start tailoring ──

async function startTailoring(jobDescription: string, sourceUrl: string, sourceTitle: string) {
  const id = Date.now().toString();

  // Read settings
  const {
    openaiApiKey = "",
    openaiApiUrl = DEFAULT_API_URL,
    openaiModel = DEFAULT_MODEL,
    baseResume = "",
  } = await getStorage(["openaiApiKey", "openaiApiUrl", "openaiModel", "baseResume"]);
  const normalizedApiKey = normalizeApiKey(openaiApiKey);
  const selectedModel = openaiModel || DEFAULT_MODEL;

  // Validate
  if (!normalizedApiKey) {
    broadcast({ type: "ERROR", message: "No API key configured. Open extension settings." });
    return;
  }
  if (!baseResume) {
    broadcast({ type: "ERROR", message: "No base resume configured. Open extension settings." });
    return;
  }
  // Add to working list
  const workingItem: WorkingItem = {
    id,
    timestamp: Date.now(),
    jobDescription,
    sourceUrl,
    sourceTitle,
    status: "tailoring",
  };
  await addWorkingItem(workingItem);

  // ── Start keepalive alarm to prevent service worker termination ──
  await startKeepalive();

  // Show "started" notification (if enabled)
  try {
    const { notifyOnStart = true } = await getStorage(["notifyOnStart"]);
    if (notifyOnStart) {
      chrome.notifications?.create(`${id}-start`, {
        type: "basic",
        iconUrl: "icon-128.png",
        title: "Tailoring Started",
        message: `New JD accepted from ${sourceTitle || sourceUrl || "manual input"}`,
      });
    }
  } catch { /* notification failure is non-critical */ }

  // Fire the API call
  try {
    const result = await tailorResumeAPI(
      baseResume,
      jobDescription,
      normalizedApiKey,
      selectedModel,
      openaiApiUrl
    );

    // Success → move to done list
    const doneItem: DoneItem = {
      id,
      timestamp: Date.now(),
      companyName: result.company,
      role: result.role,
      jobDescription,
      originalResume: baseResume,
      tailoredResume: result.resume,
      model: selectedModel,
      apiUrl: openaiApiUrl,
      sourceUrl,
      pinned: false,
      keywords: result.keywords,
    };

    await removeWorkingItem(id);
    await addDoneItem(doneItem);
    saveToCloud(doneItem); // fire-and-forget: never blocks or fails the local flow

    // Show native notification (if enabled)
    try {
      const { notificationsEnabled = true } = await getStorage(["notificationsEnabled"]);
      if (notificationsEnabled) {
        chrome.notifications?.create(id, {
          type: "basic",
          iconUrl: "icon-128.png",
          title: "Resume Tailored!",
          message: `${result.company} — ${result.role}`,
        });
      }
    } catch { /* notification failure is non-critical */ }
  } catch (err: any) {
    await markWorkingFailed(id, err?.message || "Unknown error");
  } finally {
    // Stop keepalive if no more active items
    await checkKeepaliveNeeded();
  }
}

// ── Context menu click ──

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "tailor-my-resume" && info.selectionText) {
    // Wrapped in an IIFE that the onMessage pattern below also uses.
    // The alarm keepalive ensures the worker stays alive.
    startTailoring(info.selectionText, tab?.url || "", tab?.title || "");
  }
});

// ── Keyboard shortcut (Ctrl+Shift+T on Mac, Alt+Shift+T elsewhere) ──

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "tailor-selected") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || "",
      });

      const text = results?.[0]?.result?.trim();
      if (text) {
        startTailoring(text, tab.url || "", tab.title || "");
      }
    } catch (err) {
      console.error("Shortcut handler error:", err);
    }
  }
});

// ── Message handler (popup ↔ background) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Popup asks for current state on mount
  if (message.type === "GET_STATE") {
    (async () => {
      const data = await getStorage(["workingItems", "doneItems"]);
      sendResponse({
        workingItems: data.workingItems || [],
        doneItems: data.doneItems || [],
      });
    })();
    return true;
  }

  // Manual tailor request from the popup
  if (message.type === "START_TAILORING") {
    startTailoring(message.jobDescription, message.sourceUrl || "", message.sourceTitle || "");
    sendResponse({ ok: true });
    return;
  }

  // Retry a failed working item
  if (message.type === "RETRY_WORKING") {
    (async () => {
      const { workingItems = [] } = await getStorage(["workingItems"]);
      const item = workingItems.find((i: WorkingItem) => i.id === message.id);
      if (item) {
        await removeWorkingItem(message.id);
        startTailoring(item.jobDescription, item.sourceUrl, item.sourceTitle);
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Dismiss a failed working item
  if (message.type === "DISMISS_WORKING") {
    removeWorkingItem(message.id).then(() => sendResponse({ ok: true }));
    return true;
  }

  // Remove a done item
  if (message.type === "REMOVE_DONE") {
    (async () => {
      const { doneItems = [] } = await getStorage(["doneItems"]);
      await setStorage({ doneItems: doneItems.filter((i: DoneItem) => i.id !== message.id) });
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Update a done item (notes, link, pin)
  if (message.type === "UPDATE_DONE") {
    (async () => {
      const { doneItems = [] } = await getStorage(["doneItems"]);
      const updated = doneItems.map((i: DoneItem) =>
        i.id === message.id ? { ...i, ...message.updates } : i
      );
      await setStorage({ doneItems: updated });
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Toggle pin on a done item
  if (message.type === "TOGGLE_PIN_DONE") {
    (async () => {
      const { doneItems = [] } = await getStorage(["doneItems"]);
      const updated = doneItems.map((i: DoneItem) =>
        i.id === message.id ? { ...i, pinned: !i.pinned } : i
      );
      await setStorage({ doneItems: updated });
      sendResponse({ ok: true });
    })();
    return true;
  }

  // Clear all done items
  if (message.type === "CLEAR_DONE") {
    setStorage({ doneItems: [] }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
