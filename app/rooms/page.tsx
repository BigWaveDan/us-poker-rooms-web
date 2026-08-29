import Link from "next/link";
import ApiBanner from "@/components/ApiBanner";
import CoverageGrid from "@/components/CoverageGrid";
import RoomFilters from "@/components/RoomFilters";
import StatusBadge from "@/components/StatusBadge";
import { fetchRooms, fetchStates } from "@/lib/api";
import { formatPlace, formatType } from "@/lib/format";
import { SOURCED_ZERO_SET, stateName } from "@/lib/states";

export const dynamic = "force-dynamic";

type Search = {
  state?: string;
  city?: string;
  q?: string;
  status?: string;
  type?: string;
  offset?: string;
};

export const metadata = {
  title: "Rooms",
};

function one(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const state = one(sp.state)?.toUpperCase();
  const city = one(sp.city);
  const q = one(sp.q);
  const status = one(sp.status);
  const type = one(sp.type);
  const offset = Math.max(0, Number(one(sp.offset) ?? "0") || 0);
  const limit = 50;

  const [states, list] = await Promise.all([
    fetchStates(),
    fetchRooms({ state, city, q, status, type, limit, offset }),
  ]);
  const live = states.live && list.live;
  const total = list.data.total;
  const rooms = list.data.rooms;
  const zeroState = state && SOURCED_ZERO_SET.has(state);

  const qs = (nextOffset: number) => {
    const p = new URLSearchParams();
    if (state) p.set("state", state);
    if (city) p.set("city", city);
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (type) p.set("type", type);
    if (nextOffset) p.set("offset", String(nextOffset));
    const s = p.toString();
    return s ? `/rooms?${s}` : "/rooms";
  };

  return (
    <>
      <div className="kicker">Collection</div>
      <h1>Rooms</h1>
      <p className="lede">
        Search and filter sourced live poker rooms. Coverage tiles show every
        US jurisdiction; amber tiles are sourced zeros — checked, none found.
      </p>
      <ApiBanner live={live} error={list.error ?? states.error} />

      <h2>Coverage</h2>
      <CoverageGrid counts={states.data.states} />

      <h2>Directory</h2>
      <RoomFilters state={state} city={city} q={q} status={status} type={type} />

      {zeroState && (
        <div className="banner warn">
          {stateName(state)} ({state}) is a sourced zero: collection found no
          rooms. There is nothing to list here on purpose.
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty">
          {list.live
            ? "No sourced rooms match these filters."
            : "Offline fixture has no matching rooms. The live API holds the full directory."}
        </div>
      ) : (
        <div className="room-list">
          {rooms.map((room) => (
            <Link key={room.slug} href={`/rooms/${room.slug}`} className="room-row">
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
          <Link href={qs(Math.max(0, offset - limit))}>Previous</Link>
        ) : (
          <span>Previous</span>
        )}
        <span>
          {total === 0
            ? "0 rooms"
            : `${offset + 1}–${Math.min(offset + rooms.length, total)} of ${total}`}
        </span>
        {offset + limit < total ? (
          <Link href={qs(offset + limit)}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </div>
    </>
  );
}
