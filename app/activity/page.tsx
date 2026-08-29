import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activity" };

const SAMPLE = [
  {
    t: "Today",
    title: "Coverage review queued",
    body: "Placeholder. A future ingest log would land here — not a new room.",
  },
  {
    t: "Yesterday",
    title: "Source freshness check",
    body: "Sample event: 12 source URLs marked for re-retrieval. No rooms invented.",
  },
  {
    t: "This week",
    title: "Empty-state drill",
    body: "Sourced zeros remain AL, AK, DC, GA, HI, ID, SC, TN, UT, VT until new evidence exists.",
  },
  {
    t: "This month",
    title: "UI shell added",
    body: "Home, Rooms, Activity, About, and Settings wired as a normal app navigation.",
  },
];

export default function ActivityPage() {
  return (
    <>
      <div className="kicker">Workspace</div>
      <h1>Activity</h1>
      <p className="lede">
        A skeleton feed for collection work. Items below are generic filler so
        the page looks inhabited. They are not ingest history and they do not
        add poker rooms.
      </p>

      <section className="grid-2">
        <article className="card">
          <div className="stat-label">Open reviews</div>
          <div className="stat">0</div>
          <p>Empty state: nothing is waiting in this UI.</p>
        </article>
        <article className="card">
          <div className="stat-label">Failed fetches</div>
          <div className="stat">—</div>
          <p>Connect the API to populate real job stats later.</p>
        </article>
        <article className="card">
          <div className="stat-label">Watchers</div>
          <div className="stat">3</div>
          <p>Sample number for layout only.</p>
        </article>
      </section>

      <section className="card">
        <h2>Recent (placeholder)</h2>
        <ul className="timeline">
          {SAMPLE.map((item) => (
            <li key={item.title}>
              <div className="stat-label">{item.t}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
