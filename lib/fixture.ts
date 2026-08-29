import type { Room, RoomsListResponse, StateCount, StatesResponse } from "./types";
import fixtureRooms from "./fixture-rooms.json";
import { SOURCED_ZEROS, US_JURISDICTIONS } from "./states";

/** Snapshot counts from the sourced database (556 rooms, 41 states). */
const STATE_COUNTS: Record<string, number> = {
  TX: 97,
  CA: 65,
  WA: 45,
  NV: 38,
  FL: 31,
  MI: 29,
  MT: 29,
  OR: 24,
  NH: 17,
  IL: 16,
  OH: 13,
  OK: 12,
  MN: 11,
  PA: 11,
  MS: 10,
  CO: 9,
  LA: 9,
  AZ: 7,
  IN: 7,
  KY: 6,
  MO: 6,
  NY: 6,
  SD: 6,
  IA: 5,
  WV: 5,
  MD: 4,
  ND: 4,
  NJ: 4,
  VA: 4,
  CT: 3,
  DE: 3,
  NM: 3,
  RI: 3,
  WI: 3,
  AR: 2,
  KS: 2,
  MA: 2,
  NC: 2,
  ME: 1,
  NE: 1,
  WY: 1,
};

export const FIXTURE_ROOMS = fixtureRooms as Room[];
export const FIXTURE_ROOM_TOTAL = 556;

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
  let rooms = [...FIXTURE_ROOMS];
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
  return FIXTURE_ROOMS.find((r) => r.slug === slug) ?? null;
}

export function isSourcedZero(code: string): boolean {
  return (SOURCED_ZEROS as readonly string[]).includes(code);
}
