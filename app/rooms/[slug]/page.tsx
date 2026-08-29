import Link from "next/link";
import { notFound } from "next/navigation";
import ApiBanner from "@/components/ApiBanner";
import StatusBadge from "@/components/StatusBadge";
import { fetchRoom } from "@/lib/api";
import { formatGames, formatPlace, formatType } from "@/lib/format";
import { stateName } from "@/lib/states";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await fetchRoom(slug);
  return { title: data?.name ?? "Room" };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: room, live, error } = await fetchRoom(slug);

  if (!room) {
    notFound();
  }

  const sources = room.sources ?? [];

  return (
    <>
      <p className="kicker">
        <Link href="/rooms">Rooms</Link>
        {" / "}
        <Link href={`/rooms?state=${room.state}`}>{room.state}</Link>
      </p>
      <h1>{room.name}</h1>
      <p className="lede">
        {formatPlace(room)}
        {room.postal_code ? ` ${room.postal_code}` : ""} ·{" "}
        {stateName(room.state)}
      </p>
      <div className="chip-row">
        <StatusBadge status={room.status} />
        <span className="badge">{formatType(room.type)}</span>
      </div>
      <ApiBanner live={live} error={error} />

      <section className="card">
        <h2>Venue</h2>
        <dl className="dl">
          <dt>Address</dt>
          <dd>{formatPlace(room)}</dd>
          <dt>Hours</dt>
          <dd>{room.hours ?? "—"}</dd>
          <dt>Phone</dt>
          <dd>
            {room.phone ? <a href={`tel:${room.phone}`}>{room.phone}</a> : "—"}
          </dd>
          <dt>Website</dt>
          <dd>
            {room.website ? (
              <a href={room.website} rel="noreferrer" target="_blank">
                {room.website}
              </a>
            ) : (
              "—"
            )}
          </dd>
          <dt>Games</dt>
          <dd>{formatGames(room.games)}</dd>
          <dt>Stakes</dt>
          <dd>{room.stakes_notes ?? "—"}</dd>
          <dt>Tournaments</dt>
          <dd>{room.tournament_notes ?? "—"}</dd>
          <dt>Notes</dt>
          <dd>{room.notes ?? "—"}</dd>
          <dt>Coordinates</dt>
          <dd>
            {room.latitude != null && room.longitude != null
              ? `${room.latitude}, ${room.longitude}`
              : "—"}
          </dd>
        </dl>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Sources</h2>
        {sources.length === 0 ? (
          <p className="meta">No source URLs returned for this room.</p>
        ) : (
          <ul className="sources">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noreferrer" target="_blank">
                  {s.title || s.url}
                </a>
                <div className="meta">
                  {s.url}
                  {s.retrieved_at ? ` · retrieved ${s.retrieved_at}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
