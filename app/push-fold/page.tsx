"use client";

import { useMemo, useState } from "react";
import chartsData from "@/lib/push-fold-charts.json";

type Cell = { pct: number; range: string };
type ChartsFile = {
  source: string;
  antes: string[];
  positions: string[];
  stacksBB: number[];
  charts: Record<string, Record<string, Record<string, Cell>>>;
};

const DATA = chartsData as ChartsFile;

const ANTE_LABELS: Record<string, string> = {
  "0%": "0%",
  "10%": "10%",
  "12.5%": "12.5%",
  BB: "BB",
};

const POS_HINT: Record<string, string> = {
  SB: "Small Blind",
  BTN: "Button",
  CO: "Cutoff",
  HJ: "Hijack",
  LJ: "Lojack",
  "UTG+2": "UTG+2",
  "UTG+1": "UTG+1",
  UTG: "Under the Gun",
};

export default function PushFoldPage() {
  const [ante, setAnte] = useState(DATA.antes[0]);
  const [position, setPosition] = useState(DATA.positions[0]);
  const [stack, setStack] = useState(10);

  const cell = useMemo(() => {
    return DATA.charts[ante]?.[String(stack)]?.[position] ?? null;
  }, [ante, position, stack]);

  return (
    <div className="pf-page">
      <div className="pf-head">
        <div>
          <div className="kicker">Tournament · study</div>
          <h1 className="pf-title">Push / Fold</h1>
        </div>
        <p className="pf-credit">
          {DATA.source} — study purposes only. Do not use at the table during
          play.
        </p>
      </div>

      <div className="pf-controls" role="group" aria-label="Chart selectors">
        <label className="pf-field">
          <span>Ante</span>
          <div className="pf-seg" role="radiogroup" aria-label="Ante size">
            {DATA.antes.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={ante === a}
                className={ante === a ? "on" : undefined}
                onClick={() => setAnte(a)}
              >
                {ANTE_LABELS[a] ?? a}
              </button>
            ))}
          </div>
        </label>

        <label className="pf-field">
          <span>Position</span>
          <div className="pf-seg pf-seg-wrap" role="radiogroup" aria-label="Position">
            {DATA.positions.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={position === p}
                title={POS_HINT[p]}
                className={position === p ? "on" : undefined}
                onClick={() => setPosition(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </label>

        <label className="pf-field pf-stack-field">
          <span>
            Stack <strong>{stack}BB</strong>
          </span>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={stack}
            onChange={(e) => setStack(Number(e.target.value))}
            aria-valuetext={`${stack} big blinds`}
          />
          <div className="pf-stack-ticks" aria-hidden>
            {[1, 5, 10, 15].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </label>
      </div>

      <section className="pf-chart card" aria-live="polite">
        <div className="pf-meta">
          <span>
            {ANTE_LABELS[ante] ?? ante} ante
            {ante === "BB" ? "" : ""}
          </span>
          <span aria-hidden>·</span>
          <span title={POS_HINT[position]}>
            {position}
            {position === "HJ" ? " · Hijack" : ""}
          </span>
          <span aria-hidden>·</span>
          <span>{stack}BB</span>
        </div>
        {cell ? (
          <>
            <div className="pf-pct">{cell.pct.toFixed(1)}%</div>
            <pre className="pf-range">{cell.range || "—"}</pre>
          </>
        ) : (
          <p className="pf-missing">No chart for this combination.</p>
        )}
      </section>

      <p className="pf-foot">
        PokerCoaching.com — study only. Sourced ranges; not invented.
      </p>
    </div>
  );
}
