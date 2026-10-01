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
  mode: "light",
  resolved: "light",
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Inline boot script — avoids flash before hydration. Unknown values, including the removed mode, use light. */
export const THEME_BOOT_SCRIPT = `(function(){try{var k='poker-theme';var m=localStorage.getItem(k);var r=m==='dark'?'dark':'light';if(m==='system')localStorage.setItem(k,'light');document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

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
    window.addEventListener("storage", onStorage);
    window.addEventListener("poker-theme-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("poker-theme-changed", onCustom);
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
