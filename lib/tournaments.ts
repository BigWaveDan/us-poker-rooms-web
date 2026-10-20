import snapshot from "./tournaments-snapshot.json";
import type { Lookup, Tournament } from "./tournament-utils";

export * from "./tournament-utils";

type Snapshot = {
  generated_at: string;
  source: { repo: string; branch: string | null; commit: string | null };
  counts: { tournaments: number; rooms: number; subscription_endpoints: number };
  game_types: Lookup[];
  formats: Lookup[];
  tournaments: Tournament[];
};

const SNAP = snapshot as unknown as Snapshot;

export const TOURNAMENTS: Tournament[] = SNAP.tournaments;
export const GAME_TYPES: Lookup[] = SNAP.game_types;
export const FORMATS: Lookup[] = SNAP.formats;
export const SNAPSHOT_META = { generated_at: SNAP.generated_at, source: SNAP.source, counts: SNAP.counts };

export function tournamentBySlug(slug: string): Tournament | undefined {
  return TOURNAMENTS.find((t) => t.slug === slug);
}

