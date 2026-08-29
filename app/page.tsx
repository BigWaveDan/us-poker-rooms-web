import Link from "next/link";
import ApiBanner from "@/components/ApiBanner";
import CoverageGrid from "@/components/CoverageGrid";
import { fetchHealth, fetchStates } from "@/lib/api";
import { SOURCED_ZEROS } from "@/lib/states";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [health, states] = await Promise.all([fetchHealth(), fetchStates()]);
  const roomTotal = health.live ? health.data.rooms : health.data.rooms;
  const stateCount = states.data.count;
  const live = health.live && states.live;

  return (
    <>
      <section className="hero">
        <div className="kicker">Live poker · sourced dataset</div>
        <h1>See every sourced US poker room — and every gap.</h1>
        <p className="lede">
          This app is a read-only collection UI over the US live poker rooms
          API. It does not invent rooms. If a state has zero sourced rooms, that
          is shown on purpose.
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

      <ApiBanner live={live} error={health.error ?? states.error} />

      <section className="grid-2">
        <article className="card">
          <div className="stat-label">Sourced rooms</div>
          <div className="stat">{roomTotal.toLocaleString()}</div>
          <p>
            {live
              ? "Count from GET /health."
              : "Snapshot total from the offline fixture."}
          </p>
        </article>
        <article className="card">
          <div className="stat-label">States with rooms</div>
          <div className="stat">{stateCount}</div>
          <p>Plus {SOURCED_ZEROS.length} sourced zeros (checked, none found).</p>
        </article>
        <article className="card">
          <div className="stat-label">Workspace</div>
          <div className="stat">5</div>
          <p>Home, Rooms, Activity, About, and Settings — a product shell around the dataset.</p>
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
              Search and filter the live list. Every room detail page lists the
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
          <article className="card">
            <h3>About</h3>
            <p>
              Product notes, dataset scope, and how coverage gaps are treated
              as first-class facts.
            </p>
            <p>
              <Link href="/about">Read about →</Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
