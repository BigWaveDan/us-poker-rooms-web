"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ApiBanner from "@/components/ApiBanner";
import StatusBadge from "@/components/StatusBadge";
import { formatGames, formatPlace, formatType } from "@/lib/format";
import { fieldSourceLabel, mergeOneRoom } from "@/lib/roomEdits";
import { stateName } from "@/lib/states";
import type { Room } from "@/lib/types";
import { EDITABLE_ROOM_FIELDS } from "@/lib/roomEdits";

type Props = {
  room: Room;
  live: boolean;
  error?: string;
};

export default function RoomDetailClient({ room: initial, live, error }: Props) {
  const [room, setRoom] = useState(() => mergeOneRoom(initial));

  useEffect(() => {
    const apply = () => setRoom(mergeOneRoom(initial));
    apply();
    window.addEventListener("poker-room-edits-changed", apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("poker-room-edits-changed", apply);
      window.removeEventListener("storage", apply);
    };
  }, [initial]);

  const sources = room.sources ?? [];
  const fs = room.field_sources ?? {};

  return (
    <>
      <p className="kicker">
        <Link href="/rooms">Rooms</Link>
        {" / "}
        <Link href={`/rooms?state=${room.state}`}>{room.state}</Link>
      </p>
      <h1>{room.name}</h1>
      <div className="chip-row">
        <StatusBadge status={room.status} />
        <span className="badge">{formatType(room.type)}</span>
        <span className="meta">
          {formatPlace(room)}
          {room.postal_code ? ` ${room.postal_code}` : ""} ·{" "}
          {stateName(room.state)}
        </span>
      </div>
      <ApiBanner live={live} error={error} />

      <section className="card">
        <h2>Venue</h2>
        <dl className="dl">
          <dt>Address</dt>
          <dd>
            {formatPlace(room)}
            <div className="meta">Source: {fieldSourceLabel(fs.address)}</div>
          </dd>
          <dt>Hours</dt>
          <dd>
            {room.hours ?? "—"}
            <div className="meta">Source: {fieldSourceLabel(fs.hours)}</div>
          </dd>
          <dt>Phone</dt>
          <dd>
            {room.phone ? <a href={`tel:${room.phone}`}>{room.phone}</a> : "—"}
            <div className="meta">Source: {fieldSourceLabel(fs.phone)}</div>
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
            <div className="meta">Source: {fieldSourceLabel(fs.website)}</div>
          </dd>
          <dt>Games</dt>
          <dd>
            {formatGames(room.games)}
            <div className="meta">Source: {fieldSourceLabel(fs.games)}</div>
          </dd>
          <dt>Stakes</dt>
          <dd>
            {room.stakes_notes ?? "—"}
            <div className="meta">Source: {fieldSourceLabel(fs.stakes_notes)}</div>
          </dd>
          <dt>Tournaments</dt>
          <dd>
            {room.tournament_notes ?? "—"}
            <div className="meta">
              Source: {fieldSourceLabel(fs.tournament_notes)}
            </div>
          </dd>
          <dt>Notes</dt>
          <dd>
            {room.notes ?? "—"}
            <div className="meta">Source: {fieldSourceLabel(fs.notes)}</div>
          </dd>
          <dt>Coordinates</dt>
          <dd>
            {room.latitude != null && room.longitude != null
              ? `${room.latitude}, ${room.longitude}`
              : "—"}
            <div className="meta">
              Source: {fieldSourceLabel(fs.latitude)} /{" "}
              {fieldSourceLabel(fs.longitude)}
            </div>
          </dd>
        </dl>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Field sources</h2>
        <ul className="sources">
          {EDITABLE_ROOM_FIELDS.map((k) => (
            <li key={k}>
              <strong>{k}</strong>: {fieldSourceLabel(fs[k])}
            </li>
          ))}
        </ul>
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
      <p style={{ marginTop: 16 }}>
        <Link href={`/settings/edit-room/`}>Edit room data →</Link>
      </p>
    </>
  );
}
