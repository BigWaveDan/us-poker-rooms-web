import {
  fixtureRoom,
  fixtureRoomList,
  fixtureStates,
  FIXTURE_ROOM_TOTAL,
  FIXTURE_ROOMS,
} from "./fixture";
import type {
  HealthResponse,
  Room,
  RoomsListResponse,
  RoomsQuery,
  StatesResponse,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

/** Prefer offline snapshots (static export / CI). Live API only when explicitly allowed. */
const USE_OFFLINE =
  process.env.USE_OFFLINE_SNAPSHOT === "1" ||
  process.env.NEXT_PUBLIC_USE_OFFLINE === "1";

export type FetchResult<T> = {
  data: T;
  live: boolean;
  error?: string;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchHealth(): Promise<FetchResult<HealthResponse>> {
  if (USE_OFFLINE) {
    return {
      data: { ok: true, rooms: FIXTURE_ROOM_TOTAL, db: "fixture" },
      live: false,
      error: "offline snapshot",
    };
  }
  try {
    const data = await getJson<HealthResponse>("/health");
    return { data, live: true };
  } catch (err) {
    return {
      data: { ok: false, rooms: FIXTURE_ROOM_TOTAL, db: "fixture" },
      live: false,
      error: err instanceof Error ? err.message : "API unreachable",
    };
  }
}

export async function fetchStates(): Promise<FetchResult<StatesResponse>> {
  if (USE_OFFLINE) {
    return {
      data: fixtureStates(),
      live: false,
      error: "offline snapshot",
    };
  }
  try {
    const data = await getJson<StatesResponse>("/states");
    return { data, live: true };
  } catch (err) {
    return {
      data: fixtureStates(),
      live: false,
      error: err instanceof Error ? err.message : "API unreachable",
    };
  }
}

export async function fetchRooms(
  query: RoomsQuery = {},
): Promise<FetchResult<RoomsListResponse>> {
  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;
  if (USE_OFFLINE) {
    return {
      data: fixtureRoomList({ ...query, limit, offset }),
      live: false,
      error: "offline snapshot",
    };
  }
  const params = new URLSearchParams();
  if (query.state) params.set("state", query.state);
  if (query.city) params.set("city", query.city);
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.type) params.set("type", query.type);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const qs = params.toString();
  try {
    const data = await getJson<RoomsListResponse>(`/rooms?${qs}`);
    return { data, live: true };
  } catch (err) {
    return {
      data: fixtureRoomList({ ...query, limit, offset }),
      live: false,
      error: err instanceof Error ? err.message : "API unreachable",
    };
  }
}

export async function fetchRoom(
  slug: string,
): Promise<FetchResult<Room | null>> {
  if (USE_OFFLINE) {
    const local = fixtureRoom(slug);
    return {
      data: local,
      live: false,
      error: local ? "offline snapshot" : "not found in snapshot",
    };
  }
  try {
    const data = await getJson<Room>(`/rooms/${encodeURIComponent(slug)}`);
    return { data, live: true };
  } catch (err) {
    const local = fixtureRoom(slug);
    if (local) {
      return {
        data: local,
        live: false,
        error: err instanceof Error ? err.message : "API unreachable",
      };
    }
    return {
      data: null,
      live: false,
      error: err instanceof Error ? err.message : "API unreachable",
    };
  }
}

export { FIXTURE_ROOMS, FIXTURE_ROOM_TOTAL };
