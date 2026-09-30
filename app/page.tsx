import Link from "next/link";
import ApiBanner from "@/components/ApiBanner";
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
  const live = health.live && states.live && roomsResult.live;
  const mapRooms = roomsResult.data.rooms.filter(
    (r) => r.latitude != null && r.longitude != null,
  );

  return (
    <>
      <section className="hero">
        <div className="kicker">Live poker · sourced dataset</div>
        <h1>Map every sourced US poker room — and every gap.</h1>
        <p className="lede">
          Read-only collection UI over the US live poker rooms dataset. Pins
          come from rooms with latitude and longitude. Nothing is invented; if a
          state has zero sourced rooms, that is shown on purpose.
        </p>
        <div className="chip-row">
          <Link href="/rooms" className="btn">
            Browse rooms
          </Link>
          <Link href="/about" className="btn ghost">
            How this works
          </Link>
        </div>
      </section>

      <ApiBanner
        live={live}
        error={health.error ?? states.error ?? roomsResult.error}
      />

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
        <p className="lede">
          Highlighted tiles are sourced zeros: AL, AK, DC, GA, HI, ID, SC, TN,
          UT, VT. They are not missing data — collection found no rooms.
        </p>
        <CoverageGrid counts={states.data.states} />
      </section>

      <section>
        <h2>Start here</h2>
        <div className="grid-2">
          <article className="card">
            <h3>Rooms</h3>
            <p>
              Search and filter the directory. Every detail page lists the
              source URLs the record came from.
            </p>
            <p>
              <Link href="/rooms">Open the collection →</Link>
            </p>
          </article>
          <article className="card">
            <h3>Activity</h3>
            <p>
              Placeholder ingest timeline and empty states for a future
              collection log. No synthetic rooms are added here.
            </p>
            <p>
              <Link href="/activity">View activity →</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
