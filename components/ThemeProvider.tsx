"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import {
  applyThemeToDocument,
  persistTheme,
  readStoredTheme,
  resolveTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "dark",
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Inline boot script — avoids flash before hydration. Default: system → dark if unknown. */
export const THEME_BOOT_SCRIPT = `(function(){try{var k='poker-theme';var m=localStorage.getItem(k)||'system';var r=m==='light'||m==='dark'?m:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    setModeState(stored);
    setResolved(applyThemeToDocument(stored));

    const onStorage = (e: StorageEvent) => {
      if (e.key === "poker-theme") {
        const next = readStoredTheme();
        setModeState(next);
        setResolved(applyThemeToDocument(next));
      }
    };
    const onCustom = () => {
      const next = readStoredTheme();
      setModeState(next);
      setResolved(applyThemeToDocument(next));
    };
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onMq = () => {
      const next = readStoredTheme();
      if (next === "system") setResolved(applyThemeToDocument(next));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("poker-theme-changed", onCustom);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("poker-theme-changed", onCustom);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setResolved(resolveTheme(next));
    persistTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
