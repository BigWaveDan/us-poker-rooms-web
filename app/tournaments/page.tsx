import { Suspense } from "react";
import TournamentsDirectory from "@/components/TournamentsDirectory";
import { FORMATS, GAME_TYPES, SNAPSHOT_META, TOURNAMENTS, toRow } from "@/lib/tournaments";

export const metadata = {
  title: "Tournaments",
};

export default function TournamentsPage() {
  const rows = TOURNAMENTS.map(toRow);
  const usedGames = new Set(rows.map((r) => r.game_type));
  const usedFormats = new Set(rows.flatMap((r) => r.formats));
  const generated = SNAPSHOT_META.generated_at ? SNAPSHOT_META.generated_at.slice(0, 10) : null;
  return (
    <>
      <h1>Tournaments</h1>
      <p className="meta">
        {SNAPSHOT_META.counts.tournaments} tournaments at {SNAPSHOT_META.counts.rooms} rooms
        {generated ? ` · collected ${generated}` : ""}
      </p>
      <Suspense fallback={<p className="meta">Loading…</p>}>
        <TournamentsDirectory
          rows={rows}
          gameTypes={GAME_TYPES.filter((g) => usedGames.has(g.slug))}
          formats={FORMATS.filter((f) => usedFormats.has(f.slug))}
        />
      </Suspense>
    </>
  );
}
