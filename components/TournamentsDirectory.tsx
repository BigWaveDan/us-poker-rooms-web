"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { US_JURISDICTIONS } from "@/lib/states";
import {
  inDateRange,
  money,
  sortKey,
  whenLabel,
  type Lookup,
  type TournamentRow,
} from "@/lib/tournament-utils";

const PAGE_SIZE = 40;
const KEYS = ["q", "state", "room", "game", "format", "min", "max", "from", "to"] as const;
type Key = (typeof KEYS)[number];
type Filters = Partial<Record<Key, string>>;

function readFilters(sp: URLSearchParams): Filters {
  const f: Filters = {};
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v) f[k] = v;
  }
  return f;
}

function norm(s: string | null | undefined) {
  return (s ?? "").toLowerCase();
}

export default function TournamentsDirectory({
  rows,
  gameTypes,
  formats,
}: {
  rows: TournamentRow[];
  gameTypes: Lookup[];
  formats: Lookup[];
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = readFilters(new URLSearchParams(sp.toString()));
  const page = Math.max(1, Number(sp.get("page") || 1) || 1);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);

  function push(next: Filters, nextPage = 1) {
    const p = new URLSearchParams();
    for (const k of KEYS) if (next[k]) p.set(k, next[k] as string);
    if (nextPage > 1) p.set("page", String(nextPage));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function set(k: Key, v: string) {
    const next = { ...filters, [k]: v || undefined };
    if (k === "state") next.room = undefined;
    push(next);
  }

  // debounce the text search into the URL
  useEffect(() => {
    if ((filters.q ?? "") === q) return;
    const id = setTimeout(() => push({ ...filters, q: q || undefined }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const states = useMemo(() => {
    const s = new Set(rows.map((r) => r.state).filter(Boolean) as string[]);
    return US_JURISDICTIONS.filter((j) => s.has(j.code));
  }, [rows]);

  const rooms = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; city: string | null; state: string | null }>();
    for (const r of rows) {
      if (filters.state && r.state !== filters.state) continue;
      if (!m.has(r.room_slug)) m.set(r.room_slug, { slug: r.room_slug, name: r.room_name, city: r.city, state: r.state });
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, filters.state]);

  const filtered = useMemo(() => {
    const min = filters.min ? Number(filters.min) * 100 : null;
    const max = filters.max ? Number(filters.max) * 100 : null;
    const needle = norm(filters.q);
    return rows
      .filter((r) => {
        if (filters.state && r.state !== filters.state) return false;
        if (filters.room && r.room_slug !== filters.room) return false;
        if (filters.game && r.game_type !== filters.game) return false;
        if (filters.format && !r.formats.includes(filters.format)) return false;
        if (min != null && (r.buy_in_cents == null || r.buy_in_cents < min)) return false;
        if (max != null && (r.buy_in_cents == null || r.buy_in_cents > max)) return false;
        if (!inDateRange(r, filters.from, filters.to)) return false;
        if (needle && !`${norm(r.name)} ${norm(r.room_name)} ${norm(r.city)} ${norm(r.state)}`.includes(needle)) return false;
        return true;
      })
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || a.room_name.localeCompare(b.room_name));
  }, [rows, filters.state, filters.room, filters.game, filters.format, filters.min, filters.max, filters.from, filters.to, filters.q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const active = KEYS.filter((k) => filters[k]).length;
  const gameName = (s: string | null) => (s && s !== "other" ? gameTypes.find((g) => g.slug === s)?.name ?? "" : "");

  return (
    <>
      <div className="tf-bar">
        <input
          type="search"
          className="tf-search"
          placeholder="Search tournament, room, city"
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className="btn ghost tf-toggle"
          aria-expanded={open}
          aria-controls="tf-filters"
          onClick={() => setOpen((o) => !o)}
        >
          Filters{active ? ` (${active})` : ""}
        </button>
      </div>

      <div id="tf-filters" className={`tf-filters${open ? " open" : ""}`}>
        <label>
          <span>State</span>
          <select value={filters.state ?? ""} onChange={(e) => set("state", e.target.value)}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Room</span>
          <select value={filters.room ?? ""} onChange={(e) => set("room", e.target.value)}>
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}{r.city ? ` (${r.city}, ${r.state})` : ""}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Game</span>
          <select value={filters.game ?? ""} onChange={(e) => set("game", e.target.value)}>
            <option value="">All games</option>
            {gameTypes.map((g) => (
              <option key={g.slug} value={g.slug}>{g.slug === "other" ? "Game not specified" : g.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Format</span>
          <select value={filters.format ?? ""} onChange={(e) => set("format", e.target.value)}>
            <option value="">All formats</option>
            {formats.map((f) => (
              <option key={f.slug} value={f.slug}>{f.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Buy-in min ($)</span>
          <input type="number" inputMode="numeric" min={0} step={5} value={filters.min ?? ""} onChange={(e) => set("min", e.target.value)} />
        </label>
        <label>
          <span>Buy-in max ($)</span>
          <input type="number" inputMode="numeric" min={0} step={5} value={filters.max ?? ""} onChange={(e) => set("max", e.target.value)} />
        </label>
        <label>
          <span>From</span>
          <input type="date" value={filters.from ?? ""} onChange={(e) => set("from", e.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={filters.to ?? ""} onChange={(e) => set("to", e.target.value)} />
        </label>
        {active > 0 && (
          <button type="button" className="btn ghost tf-clear" onClick={() => { setQ(""); push({}); }}>
            Clear filters
          </button>
        )}
      </div>

      <p className="tf-count meta" aria-live="polite">
        {filtered.length === 0
          ? "0 tournaments"
          : `${(cur - 1) * PAGE_SIZE + 1}–${(cur - 1) * PAGE_SIZE + slice.length} of ${filtered.length} tournaments`}
      </p>

      {slice.length === 0 ? (
        <div className="empty">No tournaments match these filters.</div>
      ) : (
        <table className="tt">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Tournament</th>
              <th scope="col">Room</th>
              <th scope="col">Game</th>
              <th scope="col" className="num">Buy-in</th>
              <th scope="col" className="num">Guarantee</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.slug} className={r.status === "cancelled" ? "cancelled" : undefined}>
                <td className="tt-when">{whenLabel(r)}</td>
                <td className="tt-name">
                  <Link href={`/tournaments/${r.slug}/`}>{r.name}</Link>
                  {r.status === "cancelled" && <span className="badge closed">cancelled</span>}
                </td>
                <td className="tt-room">
                  {r.room_name}
                  <span className="meta">{[r.city, r.state].filter(Boolean).join(", ")}</span>
                </td>
                <td className="tt-game">{gameName(r.game_type) || <span className="faint">—</span>}</td>
                <td className="num tt-buyin">{money(r.buy_in_cents) || "—"}</td>
                <td className="num tt-gtd">{r.guarantee_cents ? `${money(r.guarantee_cents)} GTD` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 && (
        <nav className="tf-pager" aria-label="Pages">
          <button type="button" className="btn ghost" disabled={cur <= 1} onClick={() => push(filters, cur - 1)}>
            Previous
          </button>
          <span className="meta">Page {cur} of {pages}</span>
          <button type="button" className="btn ghost" disabled={cur >= pages} onClick={() => push(filters, cur + 1)}>
            Next
          </button>
        </nav>
      )}
    </>
  );
}
