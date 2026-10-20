"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { US_JURISDICTIONS } from "@/lib/states";
import {
  DAY_NAMES,
  dateLabel,
  inDateRange,
  money,
  sortKey,
  whenLabel,
  type Lookup,
  type TournamentRow,
} from "@/lib/tournament-utils";

const PAGE_SIZE = 40;
const KEYS = ["q", "state", "room", "game", "format", "min", "max", "from", "to", "group"] as const;
type Key = (typeof KEYS)[number];
type Filters = Partial<Record<Key, string>>;
type Group = "room" | "date" | "location" | "price";
const GROUPS: { value: Group; label: string }[] = [
  { value: "room", label: "Room" },
  { value: "date", label: "Date" },
  { value: "location", label: "Location" },
  { value: "price", label: "Price" },
];
const PRICE_BANDS = ["Under $100", "$100–249", "$250–499", "$500–999", "$1,000+", "Unknown"];
const STATE_NAME = Object.fromEntries(US_JURISDICTIONS.map((j) => [j.code, j.name]));

function readFilters(sp: URLSearchParams): Filters {
  const f: Filters = {};
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v) f[k] = v;
  }
  if (f.group === "room" || (f.group && !GROUPS.some((g) => g.value === f.group))) delete f.group;
  return f;
}

function same(a: Filters, b: Filters) {
  return KEYS.every((k) => (a[k] ?? "") === (b[k] ?? ""));
}

function norm(s: string | null | undefined) {
  return (s ?? "").toLowerCase();
}

function priceBand(c: number | null): number {
  if (c == null) return 5;
  if (c < 100_00) return 0;
  if (c < 250_00) return 1;
  if (c < 500_00) return 2;
  if (c < 1000_00) return 3;
  return 4;
}

type Heading = { key: string; sort: string; label: React.ReactNode; sub?: string };

function heading(r: TournamentRow, group: Group): Heading {
  const place = [r.city, r.state].filter(Boolean).join(", ");
  if (group === "date") {
    if (r.start_date) return { key: r.start_date, sort: `0${r.start_date}`, label: dateLabel(r.start_date) };
    if (r.recurrence === "daily" || r.recurrence_days.length === 7) return { key: "daily", sort: "1", label: "Daily" };
    if (r.recurrence_days.length) {
      const d = r.recurrence_days.map((x) => DAY_NAMES[x] ?? x).join(", ");
      return { key: `w-${d}`, sort: `2${sortKey(r).slice(1, 2)}${d}`, label: `Every ${d}` };
    }
    return { key: "none", sort: "3", label: "Date not listed" };
  }
  if (group === "location") {
    const st = r.state ?? "";
    const name = STATE_NAME[st] ?? (st || "State not listed");
    return { key: `${st}|${r.city ?? ""}`, sort: `${name}|${r.city ?? ""}`, label: `${name} · ${r.city ?? "City not listed"}` };
  }
  if (group === "price") {
    const b = priceBand(r.buy_in_cents);
    return { key: `p${b}`, sort: String(b), label: PRICE_BANDS[b] };
  }
  return {
    key: r.room_slug,
    sort: `${r.room_name.toLowerCase()}|${r.room_slug}`,
    label: <Link href={`/rooms/${r.room_slug}/`}>{r.room_name}</Link>,
    sub: place,
  };
}

function summary(f: Filters, rooms: Map<string, string>, gameTypes: Lookup[], formats: Lookup[]): string {
  const parts: string[] = [];
  if (f.q) parts.push(`“${f.q}”`);
  if (f.state) parts.push(f.state);
  if (f.room) parts.push(rooms.get(f.room) ?? f.room);
  if (f.game) parts.push(gameTypes.find((g) => g.slug === f.game)?.name ?? f.game);
  if (f.format) parts.push(formats.find((x) => x.slug === f.format)?.name ?? f.format);
  if (f.min || f.max) parts.push(`${f.min ? `$${f.min}` : "$0"}–${f.max ? `$${f.max}` : "any"}`);
  if (f.from || f.to) parts.push(`${f.from ?? "…"} to ${f.to ?? "…"}`);
  if (f.group) parts.push(`by ${f.group}`);
  return parts.join(" · ");
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
  const spKey = sp.toString();
  const applied = useMemo(() => readFilters(new URLSearchParams(spKey)), [spKey]);
  const page = Math.max(1, Number(sp.get("page") || 1) || 1);
  const group: Group = (applied.group as Group) ?? "room";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(applied);

  // when the URL changes (Apply, Clear, back/forward), the staged form follows it
  useEffect(() => setDraft(applied), [applied]);

  function push(next: Filters, nextPage = 1) {
    const p = new URLSearchParams();
    for (const k of KEYS) if (next[k] && !(k === "group" && next[k] === "room")) p.set(k, next[k] as string);
    if (nextPage > 1) p.set("page", String(nextPage));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function stage(k: Key, v: string) {
    setDraft((d) => {
      const next = { ...d, [k]: v || undefined };
      if (k === "state" && d.state !== v) next.room = undefined;
      return next;
    });
  }

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    push(draft);
    setOpen(false);
  }

  function clear() {
    setDraft({});
    push({});
  }

  const states = useMemo(() => {
    const s = new Set(rows.map((r) => r.state).filter(Boolean) as string[]);
    return US_JURISDICTIONS.filter((j) => s.has(j.code));
  }, [rows]);

  const roomNames = useMemo(() => new Map(rows.map((r) => [r.room_slug, r.room_name])), [rows]);

  const draftRooms = useMemo(() => {
    const m = new Map<string, { slug: string; name: string; city: string | null; state: string | null }>();
    for (const r of rows) {
      if (draft.state && r.state !== draft.state) continue;
      if (!m.has(r.room_slug)) m.set(r.room_slug, { slug: r.room_slug, name: r.room_name, city: r.city, state: r.state });
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, draft.state]);

  const list = useMemo(() => {
    const f = applied;
    const min = f.min ? Number(f.min) * 100 : null;
    const max = f.max ? Number(f.max) * 100 : null;
    const needle = norm(f.q);
    return rows
      .filter((r) => {
        if (f.state && r.state !== f.state) return false;
        if (f.room && r.room_slug !== f.room) return false;
        if (f.game && r.game_type !== f.game) return false;
        if (f.format && !r.formats.includes(f.format)) return false;
        if (min != null && (r.buy_in_cents == null || r.buy_in_cents < min)) return false;
        if (max != null && (r.buy_in_cents == null || r.buy_in_cents > max)) return false;
        if (!inDateRange(r, f.from, f.to)) return false;
        if (needle && !`${norm(r.name)} ${norm(r.room_name)} ${norm(r.city)} ${norm(r.state)}`.includes(needle)) return false;
        return true;
      })
      .map((r) => ({ r, h: heading(r, group), k: sortKey(r) }))
      .sort((a, b) => a.h.sort.localeCompare(b.h.sort) || a.k.localeCompare(b.k) || a.r.room_name.localeCompare(b.r.room_name));
  }, [rows, applied, group]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const active = KEYS.filter((k) => applied[k]).length;
  const dirty = !same(draft, applied);
  const gameName = (s: string | null) => (s && s !== "other" ? gameTypes.find((g) => g.slug === s)?.name ?? "" : "");
  const showRoom = group !== "room";
  const cols = showRoom ? 6 : 5;
  const sum = summary(applied, roomNames, gameTypes, formats);

  return (
    <>
      <form className="tf-form" onSubmit={apply}>
        <div className="tf-bar">
          <button
            type="button"
            className="btn ghost tf-toggle"
            aria-expanded={open}
            aria-controls="tf-panel"
            onClick={() => setOpen((o) => !o)}
          >
            Filters{active ? ` (${active})` : ""}
          </button>
          <button type="submit" className="btn tf-apply" disabled={!dirty}>
            Apply
          </button>
          {sum && <span className="tf-summary meta" title={sum}>{sum}</span>}
        </div>

        <div id="tf-panel" className={`tf-collapse${open ? " open" : ""}`} aria-hidden={!open} inert={!open}>
          <div className="tf-collapse-inner">
            <div className="tf-filters">
              <label className="tf-wide">
                <span>Search</span>
                <input
                  type="search"
                  placeholder="Tournament, room, city"
                  value={draft.q ?? ""}
                  onChange={(e) => stage("q", e.target.value)}
                />
              </label>
              <label>
                <span>Group by</span>
                <select value={draft.group ?? "room"} onChange={(e) => stage("group", e.target.value)}>
                  {GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>State</span>
                <select value={draft.state ?? ""} onChange={(e) => stage("state", e.target.value)}>
                  <option value="">All states</option>
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Room</span>
                <select value={draft.room ?? ""} onChange={(e) => stage("room", e.target.value)}>
                  <option value="">All rooms</option>
                  {draftRooms.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.name}{r.city ? ` (${r.city}, ${r.state})` : ""}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Game</span>
                <select value={draft.game ?? ""} onChange={(e) => stage("game", e.target.value)}>
                  <option value="">All games</option>
                  {gameTypes.map((g) => (
                    <option key={g.slug} value={g.slug}>{g.slug === "other" ? "Game not specified" : g.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Format</span>
                <select value={draft.format ?? ""} onChange={(e) => stage("format", e.target.value)}>
                  <option value="">All formats</option>
                  {formats.map((f) => (
                    <option key={f.slug} value={f.slug}>{f.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Buy-in min ($)</span>
                <input type="number" inputMode="numeric" min={0} step={5} value={draft.min ?? ""} onChange={(e) => stage("min", e.target.value)} />
              </label>
              <label>
                <span>Buy-in max ($)</span>
                <input type="number" inputMode="numeric" min={0} step={5} value={draft.max ?? ""} onChange={(e) => stage("max", e.target.value)} />
              </label>
              <label>
                <span>From</span>
                <input type="date" value={draft.from ?? ""} onChange={(e) => stage("from", e.target.value)} />
              </label>
              <label>
                <span>To</span>
                <input type="date" value={draft.to ?? ""} onChange={(e) => stage("to", e.target.value)} />
              </label>
              {(active > 0 || dirty) && (
                <button type="button" className="btn ghost tf-clear" onClick={clear}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <p className="tf-count meta" aria-live="polite">
        {list.length === 0
          ? "0 tournaments"
          : `${(cur - 1) * PAGE_SIZE + 1}–${(cur - 1) * PAGE_SIZE + slice.length} of ${list.length} tournaments`}
      </p>

      {slice.length === 0 ? (
        <div className="empty">No tournaments match these filters.</div>
      ) : (
        <table className={`tt${showRoom ? "" : " no-room"}`}>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Tournament</th>
              {showRoom && <th scope="col">Room</th>}
              <th scope="col">Game</th>
              <th scope="col" className="num">Buy-in</th>
              <th scope="col" className="num">Guarantee</th>
            </tr>
          </thead>
          <tbody>
            {slice.map(({ r, h }, i) => {
              const newGroup = i === 0 || slice[i - 1].h.key !== h.key;
              return (
                <Fragment key={r.slug}>
                  {newGroup && (
                    <tr className="tt-group">
                      <th colSpan={cols} scope="colgroup">
                        <span className="tt-group-label">{h.label}</span>
                        {h.sub && <span className="meta">{h.sub}</span>}
                      </th>
                    </tr>
                  )}
                  <tr className={r.status === "cancelled" ? "cancelled" : undefined}>
                    <td className="tt-when">{whenLabel(r)}</td>
                    <td className="tt-name">
                      <Link href={`/tournaments/${r.slug}/`}>{r.name}</Link>
                      {r.status === "cancelled" && <span className="badge closed">cancelled</span>}
                    </td>
                    {showRoom && (
                      <td className="tt-room">
                        {r.room_name}
                        <span className="meta">{[r.city, r.state].filter(Boolean).join(", ")}</span>
                      </td>
                    )}
                    <td className="tt-game">{gameName(r.game_type) || <span className="faint">—</span>}</td>
                    <td className="num tt-buyin">{money(r.buy_in_cents) || "—"}</td>
                    <td className="num tt-gtd">{r.guarantee_cents ? `${money(r.guarantee_cents)} GTD` : "—"}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {pages > 1 && (
        <nav className="tf-pager" aria-label="Pages">
          <button type="button" className="btn ghost" disabled={cur <= 1} onClick={() => push(applied, cur - 1)}>
            Previous
          </button>
          <span className="meta">Page {cur} of {pages}</span>
          <button type="button" className="btn ghost" disabled={cur >= pages} onClick={() => push(applied, cur + 1)}>
            Next
          </button>
        </nav>
      )}
    </>
  );
}
