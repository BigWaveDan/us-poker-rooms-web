"use client";

import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsPage() {
  const { mode, setMode } = useTheme();

  return (
    <>
      <div className="kicker">Workspace</div>
      <h1>Settings</h1>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Appearance</h2>
        <p className="meta">
          Default follows system preference (falls back to dark). Saved as{" "}
          <code>poker-theme</code> in localStorage.
        </p>
        <div className="theme-seg" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={mode === opt.id}
              className={mode === opt.id ? "on" : undefined}
              onClick={() => setMode(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>API</h2>
        <div className="toggle">
          <div>
            <strong>Base URL</strong>
            <div className="meta">
              From <code>NEXT_PUBLIC_API_BASE</code>
            </div>
          </div>
          <code>{API_BASE}</code>
        </div>
      </section>

      <h2 style={{ marginTop: 24 }}>Tools</h2>
      <div className="settings-hub">
        <Link href="/settings/edit-room/" className="settings-link">
          <h3>Edit room data</h3>
          <p>
            Improve an existing room&apos;s fields and per-field sources. Saved
            locally in this browser.
          </p>
        </Link>
        <div className="settings-link disabled" aria-disabled="true">
          <h3>Import / sync</h3>
          <p>Pull updates from the live API into the offline overlay.</p>
          <span className="soon">Coming soon — not wired</span>
        </div>
        <div className="settings-link disabled" aria-disabled="true">
          <h3>Contribute edits</h3>
          <p>Package local overlays for upstream review.</p>
          <span className="soon">Coming soon — not wired</span>
        </div>
      </div>
    </>
  );
}
