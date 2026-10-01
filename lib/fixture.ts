import type { Room, RoomsListResponse, StateCount, StatesResponse } from "./types";
import roomsSnapshot from "./rooms-snapshot.json";
import { SOURCED_ZEROS, US_JURISDICTIONS } from "./states";
import { mergeOneRoom, mergeRoomEdits } from "./roomEdits";

/** Full offline snapshot synced from us-poker-rooms/poker.db (see scripts/refresh_rooms.py). */
export const FIXTURE_ROOMS = roomsSnapshot as Room[];
export const FIXTURE_ROOM_TOTAL = FIXTURE_ROOMS.length;

/** Snapshot rooms with localStorage edit overlay applied (browser only; SSR = base). */
export function getFixtureRooms(): Room[] {
  if (typeof window === "undefined") return FIXTURE_ROOMS;
  return mergeRoomEdits(FIXTURE_ROOMS);
}

function buildStateCounts(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of FIXTURE_ROOMS) {
    const code = (r.state || "").toUpperCase();
    if (!code) continue;
    m[code] = (m[code] ?? 0) + 1;
  }
  return m;
}

const STATE_COUNTS = buildStateCounts();

export function fixtureStates(): StatesResponse {
  const states: StateCount[] = Object.entries(STATE_COUNTS)
    .map(([state, rooms]) => ({ state, rooms }))
    .sort((a, b) => b.rooms - a.rooms || a.state.localeCompare(b.state));
  return { count: states.length, states };
}

export function fixtureCoverage(): StateCount[] {
  return US_JURISDICTIONS.map((j) => ({
    state: j.code,
    rooms: STATE_COUNTS[j.code] ?? 0,
  }));
}

export function fixtureRoomList(params: {
  state?: string;
  city?: string;
  q?: string;
  status?: string;
  type?: string;
  limit: number;
  offset: number;
}): RoomsListResponse {
  let rooms = [...getFixtureRooms()];
  const stateFilter = params.state;
  if (stateFilter) {
    rooms = rooms.filter((r) => r.state === stateFilter.toUpperCase());
  }
  const cityFilter = params.city;
  if (cityFilter) {
    const cityLc = cityFilter.toLowerCase();
    rooms = rooms.filter((r) => (r.city ?? "").toLowerCase() === cityLc);
  }
  const statusFilter = params.status;
  if (statusFilter) {
    rooms = rooms.filter((r) => r.status === statusFilter);
  }
  const typeFilter = params.type;
  if (typeFilter) {
    rooms = rooms.filter((r) => r.type === typeFilter);
  }
  const qFilter = params.q;
  if (qFilter) {
    const q = qFilter.toLowerCase();
    rooms = rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q),
    );
  }
  const total = rooms.length;
  const slice = rooms.slice(params.offset, params.offset + params.limit);
  return { total, limit: params.limit, offset: params.offset, rooms: slice };
}

export function fixtureRoom(slug: string): Room | null {
  const base = FIXTURE_ROOMS.find((r) => r.slug === slug) ?? null;
  if (!base) return null;
  if (typeof window === "undefined") return base;
  return mergeOneRoom(base);
}

export function fixtureRoomsWithCoords(): Room[] {
  return getFixtureRooms().filter((r) => r.latitude != null && r.longitude != null);
}

export function isSourcedZero(code: string): boolean {
  return (SOURCED_ZEROS as readonly string[]).includes(code);
}
