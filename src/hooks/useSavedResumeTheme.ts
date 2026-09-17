import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumeTheme, ResumeThemeLibrary } from "@/types/extension";
import { DEFAULT_RESUME_THEME, mergeResumeTheme } from "@/utils/resumeTheme";

/** Do not expose defaults as the active theme while the saved theme is loading. */
export function useSavedResumeTheme() {
  const [theme, setTheme] = useState(DEFAULT_RESUME_THEME);
  const [library, setLibrary] = useState<ResumeThemeLibrary>({ activeId: "default", themes: [] });
  const libraryRef = useRef(library);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const revision = useRef(0);
  const hasStorage = () => typeof chrome !== "undefined" && !!chrome.storage?.local;

  const reload = useCallback(async () => {
    const current = ++revision.current;
    setError("");
    try {
      const stored = hasStorage()
        ? await new Promise<{ resumeTheme?: ResumeTheme; resumeThemeLibrary?: ResumeThemeLibrary }>((resolve, reject) => {
            chrome.storage.local.get(["resumeTheme", "resumeThemeLibrary"], (result) => {
              const failure = chrome.runtime.lastError;
              if (failure) reject(new Error(failure.message));
              else resolve(result);
            });
          })
        : {
            resumeTheme: JSON.parse(localStorage.getItem("resumeTheme") || "null"),
            resumeThemeLibrary: JSON.parse(localStorage.getItem("resumeThemeLibrary") || "null"),
          };
      if (current !== revision.current) return;
      // Preserve the existing single theme as the first preset on upgrade.
      const themes = stored.resumeThemeLibrary?.themes?.length
        ? stored.resumeThemeLibrary.themes.map((entry) => ({ ...entry, theme: mergeResumeTheme(entry.theme) }))
        : [{ id: "default", theme: mergeResumeTheme(stored.resumeTheme ?? undefined) }];
      const active = themes.find((entry) => entry.id === stored.resumeThemeLibrary?.activeId) ?? themes[0];
      const next = { activeId: active.id, themes };
      libraryRef.current = next;
      setLibrary(next);
      setTheme(active.theme);
      setReady(true);
    } catch {
      if (current === revision.current) setError("Could not load your saved theme. Please retry.");
    }
  }, []);

  useEffect(() => {
    void reload();
    const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !("resumeTheme" in changes || "resumeThemeLibrary" in changes)) return;
      void reload();
    };
    const localChanged = (event: StorageEvent) => {
      if (event.key === "resumeTheme" || event.key === "resumeThemeLibrary") void reload();
    };
    if (hasStorage()) chrome.storage.onChanged.addListener(changed);
    window.addEventListener("storage", localChanged);
    return () => {
      revision.current++;
      if (hasStorage()) chrome.storage.onChanged.removeListener(changed);
      window.removeEventListener("storage", localChanged);
    };
  }, [reload]);

  const save = useCallback(async (value: ResumeTheme, existingId?: string) => {
    const normalized = mergeResumeTheme(value);
    const current = libraryRef.current;
    if (existingId && !current.themes.some((entry) => entry.id === existingId)) throw new Error("Saved theme no longer exists");
    if (current.themes.some((entry) => entry.id !== existingId && entry.theme.name?.toLowerCase() === normalized.name?.toLowerCase())) {
      throw new Error("A theme already has this name. Choose a different name.");
    }
    const id = existingId ?? crypto.randomUUID();
    const themes = existingId
      ? current.themes.map((entry) => entry.id === id ? { id, theme: normalized } : entry)
      : [...current.themes, { id, theme: normalized }];
    const next = { activeId: id, themes };
    if (hasStorage()) {
      await new Promise<void>((resolve, reject) => {
        // Save the library and active-theme mirror together for existing consumers.
        chrome.storage.local.set({ resumeTheme: normalized, resumeThemeLibrary: next }, () => {
          const failure = chrome.runtime.lastError;
          if (failure) reject(new Error(failure.message));
          else resolve();
        });
      });
    } else {
      localStorage.setItem("resumeThemeLibrary", JSON.stringify(next));
      localStorage.setItem("resumeTheme", JSON.stringify(normalized));
    }
    revision.current++;
    setTheme(normalized);
    libraryRef.current = next;
    setLibrary(next);
    setReady(true);
    return id;
  }, []);

  return { theme, library, ready, error, reload, save };
}
