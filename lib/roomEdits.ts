import type { Room } from "./types";

/** localStorage key for per-room edit overlays (values + field_sources). */
export const ROOM_EDITS_STORAGE_KEY = "poker-room-edits";

/** Fields that can be edited and attributed to a source. */
export const EDITABLE_ROOM_FIELDS = [
  "name",
  "type",
  "address",
  "city",
  "state",
  "postal_code",
  "country",
  "latitude",
  "longitude",
  "phone",
  "website",
  "hours",
  "games",
  "stakes_notes",
  "tournament_notes",
  "notes",
  "status",
] as const;

export type EditableRoomField = (typeof EDITABLE_ROOM_FIELDS)[number];

/** Explicit attribution, or the sentinel "unknown" when no source is known. */
export type FieldSource =
  | "unknown"
  | {
      url?: string | null;
      label?: string | null;
    };

export type FieldSourcesMap = Partial<Record<EditableRoomField, FieldSource>>;

/** One room's overlay: editable column values plus per-field sources. */
export type RoomEditOverlay = Partial<
  Pick<Room, EditableRoomField | "updated_at">
> & {
  field_sources?: FieldSourcesMap;
};

export type RoomEditsStore = Record<string, RoomEditOverlay>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Normalize a stored source to FieldSource (unknown if empty/missing). */
export function normalizeFieldSource(raw: unknown): FieldSource {
  if (raw == null || raw === "" || raw === "unknown") return "unknown";
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t || t.toLowerCase() === "unknown") return "unknown";
    return { label: t };
  }
  if (typeof raw === "object") {
    const o = raw as { url?: unknown; label?: unknown };
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!url && !label) return "unknown";
    return {
      url: url || null,
      label: label || null,
    };
  }
  return "unknown";
}

export function fieldSourceLabel(src: FieldSource | undefined): string {
  if (src == null || src === "unknown") return "unknown";
  const label = src.label?.trim();
  const url = src.url?.trim();
  if (label && url) return `${label} (${url})`;
  return label || url || "unknown";
}

export function isUnknownSource(src: FieldSource | undefined): boolean {
  return src == null || src === "unknown";
}

/** Default every editable field to unknown — never infer from room.sources[]. */
export function defaultFieldSources(): FieldSourcesMap {
  const map: FieldSourcesMap = {};
  for (const key of EDITABLE_ROOM_FIELDS) {
    map[key] = "unknown";
  }
  return map;
}

export function loadRoomEdits(): RoomEditsStore {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(ROOM_EDITS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RoomEditsStore;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveRoomEditsStore(store: RoomEditsStore): void {
  if (!isBrowser()) return;
  localStorage.setItem(ROOM_EDITS_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("poker-room-edits-changed"));
}

/** Persist one room's edited values + field_sources under its id. */
export function saveRoomEdit(roomId: number, overlay: RoomEditOverlay): void {
  const store = loadRoomEdits();
  store[String(roomId)] = overlay;
  saveRoomEditsStore(store);
}

export function getRoomEdit(roomId: number): RoomEditOverlay | undefined {
  return loadRoomEdits()[String(roomId)];
}

function mergeGames(
  base: Room["games"],
  overlay: unknown,
): Room["games"] {
  if (overlay === undefined) return base;
  if (overlay == null) return null;
  if (Array.isArray(overlay)) return overlay as string[];
  if (typeof overlay === "string") {
    const parts = overlay
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : null;
  }
  return base;
}

/** Apply a single overlay onto a base room (snapshot / API). */
export function applyRoomEdit(room: Room, overlay?: RoomEditOverlay): Room {
  if (!overlay) {
    return {
      ...room,
      field_sources: room.field_sources ?? defaultFieldSources(),
    };
  }
  const field_sources: FieldSourcesMap = {
    ...defaultFieldSources(),
    ...(room.field_sources ?? {}),
    ...(overlay.field_sources ?? {}),
  };
  for (const key of EDITABLE_ROOM_FIELDS) {
    field_sources[key] = normalizeFieldSource(field_sources[key]);
  }

  return {
    ...room,
    name: overlay.name !== undefined ? String(overlay.name) : room.name,
    type: overlay.type !== undefined ? (overlay.type as Room["type"]) : room.type,
    address:
      overlay.address !== undefined ? (overlay.address as string | null) : room.address,
    city: overlay.city !== undefined ? (overlay.city as string | null) : room.city,
    state: overlay.state !== undefined ? String(overlay.state) : room.state,
    postal_code:
      overlay.postal_code !== undefined
        ? (overlay.postal_code as string | null)
        : room.postal_code,
    country:
      overlay.country !== undefined
        ? (overlay.country as string | null)
        : room.country,
    latitude:
      overlay.latitude !== undefined
        ? (overlay.latitude as number | null)
        : room.latitude,
    longitude:
      overlay.longitude !== undefined
        ? (overlay.longitude as number | null)
        : room.longitude,
    phone: overlay.phone !== undefined ? (overlay.phone as string | null) : room.phone,
    website:
      overlay.website !== undefined ? (overlay.website as string | null) : room.website,
    hours: overlay.hours !== undefined ? (overlay.hours as string | null) : room.hours,
    games: mergeGames(room.games, overlay.games),
    stakes_notes:
      overlay.stakes_notes !== undefined
        ? (overlay.stakes_notes as string | null)
        : room.stakes_notes,
    tournament_notes:
      overlay.tournament_notes !== undefined
        ? (overlay.tournament_notes as string | null)
        : room.tournament_notes,
    notes: overlay.notes !== undefined ? (overlay.notes as string | null) : room.notes,
    status: overlay.status !== undefined ? String(overlay.status) : room.status,
    updated_at:
      overlay.updated_at !== undefined
        ? String(overlay.updated_at)
        : room.updated_at,
    field_sources,
  };
}

export function mergeRoomEdits(rooms: Room[]): Room[] {
  const store = loadRoomEdits();
  if (Object.keys(store).length === 0) {
    return rooms.map((r) => ({
      ...r,
      field_sources: r.field_sources ?? defaultFieldSources(),
    }));
  }
  return rooms.map((r) => applyRoomEdit(r, store[String(r.id)]));
}

export function mergeOneRoom(room: Room): Room {
  return applyRoomEdit(room, getRoomEdit(room.id));
}

/** Build overlay payload from form state for save. */
export function buildOverlayFromForm(input: {
  values: Partial<Record<EditableRoomField, string>>;
  sources: Partial<Record<EditableRoomField, { label: string; url: string }>>;
}): RoomEditOverlay {
  const values = input.values;
  const field_sources: FieldSourcesMap = {};
  for (const key of EDITABLE_ROOM_FIELDS) {
    const s = input.sources[key];
    const label = s?.label?.trim() ?? "";
    const url = s?.url?.trim() ?? "";
    if (!label && !url) {
      field_sources[key] = "unknown";
    } else {
      field_sources[key] = { label: label || null, url: url || null };
    }
  }

  const emptyToNull = (s: string | undefined): string | null => {
    if (s == null) return null;
    const t = s.trim();
    return t === "" ? null : t;
  };

  const parseCoord = (s: string | undefined): number | null => {
    if (s == null || s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const gamesRaw = values.games?.trim() ?? "";
  const games =
    gamesRaw === ""
      ? null
      : gamesRaw
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

  return {
    name: values.name?.trim() || "",
    type: emptyToNull(values.type),
    address: emptyToNull(values.address),
    city: emptyToNull(values.city),
    state: (values.state?.trim() || "").toUpperCase(),
    postal_code: emptyToNull(values.postal_code),
    country: emptyToNull(values.country),
    latitude: parseCoord(values.latitude),
    longitude: parseCoord(values.longitude),
    phone: emptyToNull(values.phone),
    website: emptyToNull(values.website),
    hours: emptyToNull(values.hours),
    games,
    stakes_notes: emptyToNull(values.stakes_notes),
    tournament_notes: emptyToNull(values.tournament_notes),
    notes: emptyToNull(values.notes),
    status: values.status?.trim() || "proposed",
    updated_at: new Date().toISOString(),
    field_sources,
  };
}

export function exportEditsJson(): string {
  return JSON.stringify(loadRoomEdits(), null, 2);
}
