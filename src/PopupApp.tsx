import { useState, useEffect, useCallback } from "react";
import { useChromeStorage } from "@/hooks/useChromeStorage";
import { WorkingItem, DoneItem } from "@/types/extension";
import { toast } from "sonner";
import { WorkingList } from "@/components/ext/WorkingList";
import { DoneList } from "@/components/ext/DoneList";
import { TailorView } from "@/components/ext/TailorView";
import { SettingsView } from "@/components/ext/SettingsView";
import { ResumeDetailView } from "@/components/ext/ResumeDetailView";
import { ArchiveView } from "@/components/ext/ArchiveView";
import { FileText, Settings, PlusCircle, Sun, Moon, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "main" | "tailor" | "settings" | "detail" | "archive";

const PopupApp = () => {
  const [view, setView] = useState<View>("main");
  const [selectedItem, setSelectedItem] = useState<DoneItem | null>(null);

  // Settings (synced with chrome.storage)
  const [apiKey, setApiKey] = useChromeStorage("openaiApiKey", "");
  const [apiUrl, setApiUrl] = useChromeStorage("openaiApiUrl", "https://api.deepseek.com");
  const [model, setModel] = useChromeStorage("openaiModel", "deepseek-v4-flash");
  const [isDarkMode, setIsDarkMode] = useChromeStorage("isDarkMode", false);
  const [baseResume, setBaseResume] = useChromeStorage("baseResume", "");
  const [notificationsEnabled, setNotificationsEnabled] = useChromeStorage("notificationsEnabled", true);
  const [notifyOnStart, setNotifyOnStart] = useChromeStorage("notifyOnStart", true);
  const [supabaseUrl, setSupabaseUrl] = useChromeStorage("supabaseUrl", "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useChromeStorage("supabaseAnonKey", "");

  // Lists — read-only from popup's perspective; all mutations go through background messages.
  // Using plain useState (NOT useChromeStorage) to avoid writing stale/default [] back to storage.
  const [workingItems, setWorkingItems] = useState<WorkingItem[]>([]);
  const [doneItems, setDoneItems] = useState<DoneItem[]>([]);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // ── Lists: popup is read-only. Background owns all data. ──
  //
  // On mount: ask the background for current state (wakes the SW if needed).
  // While open: chrome.storage.onChanged keeps us up-to-date whenever the
  //             background writes to storage (most reliable signal).
  // On focus:  re-fetch in case we missed anything while hidden.
  useEffect(() => {
    // Ask background for authoritative state
    const fetchState = () => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
      chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
        if (chrome.runtime.lastError) {
          // Background not ready — fall back to direct storage read
          chrome.storage?.local?.get(["workingItems", "doneItems"], (r) => {
            setWorkingItems(r?.workingItems || []);
            setDoneItems(r?.doneItems || []);
          });
          return;
        }
        if (response) {
          setWorkingItems(response.workingItems || []);
          setDoneItems(response.doneItems || []);
        }
      });
    };

    // Initial load
    fetchState();

    // Live updates: storage.onChanged fires every time background writes
    const onStorageChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return;
      if ("workingItems" in changes) {
        setWorkingItems(changes.workingItems.newValue || []);
      }
      if ("doneItems" in changes) {
        setDoneItems(changes.doneItems.newValue || []);
      }
    };

    // Broadcast listener (for ERROR toasts only — data comes via onChanged)
    const onMessage = (message: any) => {
      if (message.type === "ERROR") {
        toast.error(message.message);
      }
    };

    // Re-fetch on focus (popup reopen / tab switch)
    const onFocus = () => fetchState();

    if (typeof chrome !== "undefined") {
      chrome.storage?.onChanged?.addListener(onStorageChanged);
      chrome.runtime?.onMessage?.addListener(onMessage);
    }
    window.addEventListener("focus", onFocus);

    return () => {
      if (typeof chrome !== "undefined") {
        chrome.storage?.onChanged?.removeListener(onStorageChanged);
        chrome.runtime?.onMessage?.removeListener(onMessage);
      }
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Send message to background
  const sendMsg = useCallback((msg: any) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(msg);
    }
  }, []);

  // Manual tailor from popup
  const handleManualTailor = (jobDescription: string) => {
    sendMsg({ type: "START_TAILORING", jobDescription });
    toast.success("Tailoring started!");
    setView("main");
  };

  const workingCount = workingItems.filter((i) => i.status === "tailoring").length;

  return (
    <div className="h-[600px] w-[780px] bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <button
          onClick={() => { setView("main"); setSelectedItem(null); }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <FileText className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-bold">AI Resume Tailor</h1>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant={view === "tailor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("tailor")}
            className="h-7 text-xs gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            Tailor
          </Button>
          <Button
            variant={view === "archive" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("archive")}
            className="h-7 text-xs gap-1"
            title="Cloud Archive"
          >
            <Archive className="w-3 h-3" />
          </Button>
          <Button
            variant={view === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("settings")}
            className="h-7 text-xs gap-1"
          >
            <Settings className="w-3 h-3" />
          </Button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded hover:bg-accent/50 transition-colors"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {view === "main" && !selectedItem && (
          <div className="flex flex-col h-full">
            {/* Working section (always visible if items exist) */}
            {workingItems.length > 0 && (
              <WorkingList
                items={workingItems}
                onRetry={(id) => sendMsg({ type: "RETRY_WORKING", id })}
                onDismiss={(id) => sendMsg({ type: "DISMISS_WORKING", id })}
              />
            )}

            {/* Done section */}
            <DoneList
              items={doneItems}
              onViewItem={(item) => { setSelectedItem(item); setView("detail"); }}
              onRemoveItem={(id) => sendMsg({ type: "REMOVE_DONE", id })}
              onClearAll={() => sendMsg({ type: "CLEAR_DONE" })}
              onUpdateItem={(id, updates) => sendMsg({ type: "UPDATE_DONE", id, updates })}
              onTogglePin={(id) => sendMsg({ type: "TOGGLE_PIN_DONE", id })}
              hasWorkingItems={workingItems.length > 0}
            />
          </div>
        )}

        {view === "tailor" && (
          <TailorView
            onTailor={handleManualTailor}
            onCancel={() => setView("main")}
            hasApiKey={!!apiKey}
            hasResume={!!baseResume}
          />
        )}

        {view === "settings" && (
          <SettingsView
            apiKey={apiKey}
            apiUrl={apiUrl}
            model={model}
            baseResume={baseResume}
            notificationsEnabled={notificationsEnabled}
            notifyOnStart={notifyOnStart}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            onApiKeyChange={setApiKey}
            onApiUrlChange={setApiUrl}
            onModelChange={setModel}
            onBaseResumeChange={setBaseResume}
            onNotificationsEnabledChange={setNotificationsEnabled}
            onNotifyOnStartChange={setNotifyOnStart}
            onSupabaseUrlChange={setSupabaseUrl}
            onSupabaseAnonKeyChange={setSupabaseAnonKey}
            onBack={() => setView("main")}
          />
        )}

        {view === "archive" && (
          <ArchiveView
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            onBack={() => setView("main")}
            onGoToSettings={() => setView("settings")}
          />
        )}

        {view === "detail" && selectedItem && (
          <ResumeDetailView
            item={selectedItem}
            onBack={() => { setSelectedItem(null); setView("main"); }}
            onUpdateItem={(id, updates) => sendMsg({ type: "UPDATE_DONE", id, updates })}
          />
        )}
      </main>
    </div>
  );
};

export default PopupApp;
