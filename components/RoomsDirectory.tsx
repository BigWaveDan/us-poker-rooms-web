"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ApiBanner from "@/components/ApiBanner";
import CoverageGrid from "@/components/CoverageGrid";
import StatusBadge from "@/components/StatusBadge";
import { formatPlace, formatType } from "@/lib/format";
import { SOURCED_ZERO_SET, US_JURISDICTIONS, stateName } from "@/lib/states";
import type { Room, StateCount } from "@/lib/types";

const STATUSES = ["", "verified", "closed", "proposed", "rejected"];
const TYPES = ["", "card_room", "casino", "tribal_casino", "social_club", "other"];
const PAGE_SIZE = 50;

type Props = {
  rooms: Room[];
  states: StateCount[];
  live: boolean;
  error?: string;
};

function filterRooms(
  rooms: Room[],
  opts: {
    state?: string;
    city?: string;
    q?: string;
    status?: string;
    type?: string;
  },
): Room[] {
  let out = rooms;
  if (opts.state) {
    const s = opts.state.toUpperCase();
    out = out.filter((r) => r.state === s);
  }
  if (opts.city) {
    const cityLc = opts.city.toLowerCase();
    out = out.filter((r) => (r.city ?? "").toLowerCase() === cityLc);
  }
  if (opts.status) {
    out = out.filter((r) => r.status === opts.status);
  }
  if (opts.type) {
    out = out.filter((r) => r.type === opts.type);
  }
  if (opts.q) {
    const q = opts.q.toLowerCase();
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q),
    );
  }
  return out;
}

export default function RoomsDirectory({ rooms, states, live, error }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = (searchParams.get("state") || "").toUpperCase() || undefined;
  const city = searchParams.get("city") || undefined;
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);

  const filtered = useMemo(
    () => filterRooms(rooms, { state, city, q, status, type }),
    [rooms, state, city, q, status, type],
  );
  const total = filtered.length;
  const page = filtered.slice(offset, offset + PAGE_SIZE);
  const zeroState = state && SOURCED_ZERO_SET.has(state);

  function buildQs(next: Record<string, string | undefined>, nextOffset = 0) {
    const p = new URLSearchParams();
    const merged = {
      state,
      city,
      q,
      status,
      type,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    if (nextOffset) p.set("offset", String(nextOffset));
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string | undefined> = {
      q: String(fd.get("q") || "") || undefined,
      state: String(fd.get("state") || "") || undefined,
      city: String(fd.get("city") || "") || undefined,
      status: String(fd.get("status") || "") || undefined,
      type: String(fd.get("type") || "") || undefined,
    };
    router.push(buildQs(next, 0));
  }

  return (
    <>
      <div className="kicker">Collection</div>
      <h1>Rooms</h1>
      <p className="lede">
        Search and filter sourced live poker rooms. Coverage tiles show every
        US jurisdiction; amber tiles are sourced zeros — checked, none found.
      </p>
      <ApiBanner live={live} error={error} />

      <h2>Coverage</h2>
      <CoverageGrid counts={states} />

      <h2>Directory</h2>
      <form className="filters" key={`${state}-${city}-${q}-${status}-${type}`} onSubmit={onSubmit}>
        <input
          type="search"
          name="q"
          placeholder="Search name, city, slug"
          defaultValue={q ?? ""}
          aria-label="Search"
        />
        <select name="state" defaultValue={state ?? ""} aria-label="State">
          <option value="">All states</option>
          {US_JURISDICTIONS.map((j) => (
            <option key={j.code} value={j.code}>
              {j.code} — {j.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="city"
          placeholder="City"
          defaultValue={city ?? ""}
          aria-label="City"
        />
        <select name="status" defaultValue={status ?? ""} aria-label="Status">
          {STATUSES.map((s) => (
            <option key={s || "any"} value={s}>
              {s ? s : "Any status"}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={type ?? ""} aria-label="Type">
          {TYPES.map((t) => (
            <option key={t || "any"} value={t}>
              {t ? t.replace("_", " ") : "Any type"}
            </option>
          ))}
        </select>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>

      {zeroState && (
        <div className="banner warn">
          {stateName(state)} ({state}) is a sourced zero: collection found no
          rooms. There is nothing to list here on purpose.
        </div>
      )}

      {page.length === 0 ? (
        <div className="empty">
          {live
            ? "No sourced rooms match these filters."
            : "No rooms in the offline snapshot match these filters."}
        </div>
      ) : (
        <div className="room-list">
          {page.map((room) => (
            <Link
              key={room.slug}
              href={`/rooms/${room.slug}`}
              className="room-row"
            >
              <div>
                <h3>{room.name}</h3>
                <div className="meta">
                  {formatPlace(room)} · {formatType(room.type)}
                </div>
              </div>
              <div>
                <StatusBadge status={room.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="pager">
        {offset > 0 ? (
          <Link href={buildQs({}, Math.max(0, offset - PAGE_SIZE))}>
            Previous
          </Link>
        ) : (
          <span>Previous</span>
        )}
        <span>
          {total === 0
            ? "0 rooms"
            : `${offset + 1}–${Math.min(offset + page.length, total)} of ${total}`}
        </span>
        {offset + PAGE_SIZE < total ? (
          <Link href={buildQs({}, offset + PAGE_SIZE)}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </div>
    </>
  );
}
