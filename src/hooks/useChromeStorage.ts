import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook that uses chrome.storage.local for persistence.
 * Falls back to localStorage if chrome.storage is not available (dev mode).
 */
export function useChromeStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial value
  useEffect(() => {
    const isChromeExt = typeof chrome !== "undefined" && chrome.storage?.local;

    if (isChromeExt) {
      chrome.storage.local.get(key, (result) => {
        if (result[key] !== undefined) {
          try {
            setStoredValue(result[key]);
          } catch {
            setStoredValue(defaultValue);
          }
        }
        setIsLoaded(true);
      });
    } else {
      // Fallback to localStorage for development
      try {
        const item = localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch {
        // ignore
      }
      setIsLoaded(true);
    }
  }, [key]);

  // Save value
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        const isChromeExt = typeof chrome !== "undefined" && chrome.storage?.local;

        if (isChromeExt) {
          chrome.storage.local.set({ [key]: newValue });
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }

        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
