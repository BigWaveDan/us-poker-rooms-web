import { Suspense } from "react";
import RoomsDirectory from "@/components/RoomsDirectory";
import { fetchRooms, fetchStates } from "@/lib/api";

export const metadata = {
  title: "Rooms",
};

export default async function RoomsPage() {
  const [states, list] = await Promise.all([
    fetchStates(),
    fetchRooms({ limit: 5000, offset: 0 }),
  ]);
  const live = states.live && list.live;

  return (
    <Suspense fallback={<p className="lede">Loading rooms…</p>}>
      <RoomsDirectory
        rooms={list.data.rooms}
        states={states.data.states}
        live={live}
        error={list.error ?? states.error}
      />
    </Suspense>
  );
}
