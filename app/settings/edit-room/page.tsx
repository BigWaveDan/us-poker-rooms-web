"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FIXTURE_ROOMS } from "@/lib/api";
import {
  EDITABLE_ROOM_FIELDS,
  buildOverlayFromForm,
  defaultFieldSources,
  exportEditsJson,
  fieldSourceLabel,
  isUnknownSource,
  mergeOneRoom,
  normalizeFieldSource,
  saveRoomEdit,
  type EditableRoomField,
  type FieldSource,
} from "@/lib/roomEdits";
import type { Room } from "@/lib/types";

const FIELD_LABELS: Record<EditableRoomField, string> = {
  name: "Name",
  type: "Type",
  address: "Address",
  city: "City",
  state: "State",
  postal_code: "Postal code",
  country: "Country",
  latitude: "Latitude",
  longitude: "Longitude",
  phone: "Phone",
  website: "Website",
  hours: "Hours",
  games: "Games (comma-separated)",
  stakes_notes: "Stakes notes",
  tournament_notes: "Tournament notes",
  notes: "Notes",
  status: "Status",
};

const TEXT_AREAS: EditableRoomField[] = [
  "hours",
  "stakes_notes",
  "tournament_notes",
  "notes",
];

function gamesToForm(games: Room["games"]): string {
  if (!games) return "";
  if (Array.isArray(games)) return games.join(", ");
  return String(games);
}

function valueToForm(room: Room, key: EditableRoomField): string {
  if (key === "games") return gamesToForm(room.games);
  const v = room[key];
  if (v == null) return "";
  return String(v);
}

function sourceToInputs(src: FieldSource | undefined): { label: string; url: string } {
  if (src == null || src === "unknown" || isUnknownSource(src)) {
    return { label: "", url: "" };
  }
  return { label: src.label ?? "", url: src.url ?? "" };
}

export default function EditRoomPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [values, setValues] = useState<Partial<Record<EditableRoomField, string>>>({});
  const [sources, setSources] = useState<
    Partial<Record<EditableRoomField, { label: string; url: string }>>
  >({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("poker-room-edits-changed", bump);
    return () => window.removeEventListener("poker-room-edits-changed", bump);
  }, []);

  const rooms = useMemo(() => {
    void tick;
    return FIXTURE_ROOMS.map((r) => mergeOneRoom(r));
  }, [tick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms.slice(0, 40);
    return rooms
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.city ?? "").toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [rooms, query]);

  const selected = useMemo(
    () => (selectedId == null ? null : rooms.find((r) => r.id === selectedId) ?? null),
    [rooms, selectedId],
  );

  function loadRoom(room: Room) {
    setSelectedId(room.id);
    setStatusMsg(null);
    const nextValues: Partial<Record<EditableRoomField, string>> = {};
    const nextSources: Partial<Record<EditableRoomField, { label: string; url: string }>> = {};
    const fs = { ...defaultFieldSources(), ...(room.field_sources ?? {}) };
    for (const key of EDITABLE_ROOM_FIELDS) {
      nextValues[key] = valueToForm(room, key);
      nextSources[key] = sourceToInputs(normalizeFieldSource(fs[key]));
    }
    setValues(nextValues);
    setSources(nextSources);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!values.name?.trim() || !values.state?.trim()) {
      setStatusMsg("Name and state are required.");
      return;
    }
    const overlay = buildOverlayFromForm({ values, sources });
    saveRoomEdit(selected.id, overlay);
    setStatusMsg(`Saved local edit for ${overlay.name || selected.name}.`);
    setTick((t) => t + 1);
  }

  function onExport() {
    const blob = new Blob([exportEditsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poker-room-edits.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <p className="kicker">
        <Link href="/settings/">Settings</Link>
        {" / "}
        Edit room
      </p>
      <h1>Edit room data</h1>

      <section className="card">
        <label className="pf-field">
          <span>Find a room</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, city, state, or slug"
            aria-label="Search rooms"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "var(--input-bg)",
              color: "var(--ink)",
              font: "inherit",
            }}
          />
        </label>
        <div className="room-picker" role="listbox" aria-label="Rooms">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={selectedId === r.id}
              className={selectedId === r.id ? "on" : undefined}
              onClick={() => loadRoom(r)}
            >
              <strong>{r.name}</strong>
              <div className="meta">
                {[r.city, r.state].filter(Boolean).join(", ")} · {r.slug}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="meta">No rooms match that search.</p>
          )}
        </div>
      </section>

      {selected && (
        <form className="edit-form" onSubmit={onSave}>
          <p className="readonly-meta">
            id {selected.id} · slug <code>{selected.slug}</code>
            {selected.created_at ? ` · created ${selected.created_at}` : ""}
            {selected.updated_at ? ` · updated ${selected.updated_at}` : ""}
          </p>
          {selected.sources && selected.sources.length > 0 && (
            <section className="card">
              <h2>Room-level sources (display)</h2>
              <ul className="sources">
                {selected.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noreferrer" target="_blank">
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="meta">
                These are not mapped to fields. Per-field sources below default
                to unknown unless you set them.
              </p>
            </section>
          )}

          {EDITABLE_ROOM_FIELDS.map((key) => (
            <div className="edit-field" key={key}>
              <label htmlFor={`field-${key}`}>{FIELD_LABELS[key]}</label>
              {TEXT_AREAS.includes(key) ? (
                <textarea
                  id={`field-${key}`}
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              ) : key === "status" ? (
                <select
                  id={`field-${key}`}
                  value={values[key] ?? "proposed"}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                >
                  {["proposed", "verified", "closed", "rejected"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`field-${key}`}
                  type="text"
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              )}
              <div className="edit-sources">
                <label>
                  Source label
                  <input
                    type="text"
                    placeholder="unknown if empty"
                    value={sources[key]?.label ?? ""}
                    onChange={(e) =>
                      setSources((s) => ({
                        ...s,
                        [key]: {
                          label: e.target.value,
                          url: s[key]?.url ?? "",
                        },
                      }))
                    }
                  />
                </label>
                <label>
                  Source URL
                  <input
                    type="url"
                    placeholder="optional"
                    value={sources[key]?.url ?? ""}
                    onChange={(e) =>
                      setSources((s) => ({
                        ...s,
                        [key]: {
                          label: s[key]?.label ?? "",
                          url: e.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
              <div className="meta">
                Current attribution:{" "}
                {fieldSourceLabel(
                  normalizeFieldSource(
                    sources[key]?.label || sources[key]?.url
                      ? {
                          label: sources[key]?.label || null,
                          url: sources[key]?.url || null,
                        }
                      : "unknown",
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="edit-actions">
            <button type="submit" className="btn">
              Save locally
            </button>
            <button type="button" className="btn ghost" onClick={onExport}>
              Export edits JSON
            </button>
            <Link href={`/rooms/${selected.slug}/`} className="btn ghost">
              Open detail
            </Link>
          </div>
          {statusMsg && <p className="meta">{statusMsg}</p>}
          <p className="meta">
            Persists in localStorage key <code>poker-room-edits</code>. Rooms
            list/map/detail merge this browser overlay on top of the bundled
            snapshot (no server database write).
          </p>
        </form>
      )}
    </>
  );
}
