import CoverageGrid from "@/components/CoverageGrid";
import RoomsMap from "@/components/RoomsMap";
import { fetchHealth, fetchRooms, fetchStates } from "@/lib/api";
import { SOURCED_ZEROS } from "@/lib/states";

export default async function HomePage() {
  const [health, states, roomsResult] = await Promise.all([
    fetchHealth(),
    fetchStates(),
    fetchRooms({ limit: 2000 }),
  ]);
  const roomTotal = health.data.rooms;
  const stateCount = states.data.count;
  const mapRooms = roomsResult.data.rooms.filter(
    (r) => r.latitude != null && r.longitude != null,
  );

  return (
    <>
      <section className="hero">
        <div className="kicker">Live poker · sourced dataset</div>
        <h1>Map every sourced US poker room — and every gap.</h1>
      </section>

      <RoomsMap
        rooms={mapRooms}
        live={roomsResult.live}
        error={roomsResult.error}
      />

      <section className="grid-2" style={{ marginTop: 24 }}>
        <article className="card">
          <div className="stat-label">Sourced rooms</div>
          <div className="stat">{roomTotal.toLocaleString()}</div>
          <p>
            {health.live
              ? "Count from GET /health."
              : "Snapshot total from the on-device / offline JSON."}
          </p>
        </article>
        <article className="card">
          <div className="stat-label">States with rooms</div>
          <div className="stat">{stateCount}</div>
          <p>Plus {SOURCED_ZEROS.length} sourced zeros (checked, none found).</p>
        </article>
        <article className="card">
          <div className="stat-label">Map pins</div>
          <div className="stat">{mapRooms.length.toLocaleString()}</div>
          <p>Rooms with non-null latitude and longitude.</p>
        </article>
      </section>

      <section>
        <h2>Coverage</h2>
        <CoverageGrid counts={states.data.states} />
      </section>

    </>
  );
}
