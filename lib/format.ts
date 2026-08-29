import type { Room } from "./types";

export function formatGames(games: Room["games"]): string {
  if (!games) return "—";
  if (Array.isArray(games)) return games.length ? games.join(" · ") : "—";
  return String(games);
}

export function formatPlace(room: Pick<Room, "city" | "state" | "address">): string {
  const parts = [room.address, room.city, room.state].filter(Boolean);
  return parts.join(", ") || "Location not listed";
}

export function formatType(type: string | null): string {
  if (!type) return "untyped";
  return type.replaceAll("_", " ");
}
