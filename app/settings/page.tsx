import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <div className="kicker">Workspace</div>
      <h1>Settings</h1>
      <p className="lede">
        Preference skeleton. Toggles do not persist; this view exists so the
        product has a normal account-adjacent screen.
      </p>

      <section className="card">
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
        <div className="toggle">
          <div>
            <strong>Read-only mode</strong>
            <div className="meta">Always on. This UI never writes rooms.</div>
          </div>
          <div className="switch on" aria-hidden="true" />
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Display (filler)</h2>
        <div className="toggle">
          <div>
            <strong>Compact directory</strong>
            <div className="meta">Placeholder control. Not wired.</div>
          </div>
          <div className="switch" aria-hidden="true" />
        </div>
        <div className="toggle">
          <div>
            <strong>Highlight sourced zeros</strong>
            <div className="meta">Coverage tiles already do this.</div>
          </div>
          <div className="switch on" aria-hidden="true" />
        </div>
        <div className="toggle">
          <div>
            <strong>Email digest</strong>
            <div className="meta">Lorem ipsum — coming later, maybe.</div>
          </div>
          <div className="switch" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
