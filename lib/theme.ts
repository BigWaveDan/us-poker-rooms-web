export const THEME_STORAGE_KEY = "poker-theme";

export type ThemeMode = "light" | "dark";

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;

    // Migrate the removed mode (and any invalid value) to the default.
    localStorage.setItem(THEME_STORAGE_KEY, "light");
  } catch {
    /* ignore */
  }
  return "light";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  return mode;
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
