export const THEME_STORAGE_KEY = "poker-theme";

export type ThemeMode = "light" | "dark" | "system";

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyThemeToDocument(mode: ThemeMode): "light" | "dark" {
  const resolved = resolveTheme(mode);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
  return resolved;
}

export function persistTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeToDocument(mode);
  window.dispatchEvent(new Event("poker-theme-changed"));
}
