import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <div className="kicker">Product</div>
      <h1>About this workspace</h1>

      <section className="grid-2">
        <article className="card">
          <h3>What you can do</h3>
          <p>
            Browse coverage by state, search the directory, and open a room to
            see address, hours, games, and the URLs that support the record.
            Gaps are first-class: sourced zeros stay on the map.
          </p>
        </article>
        <article className="card">
          <h3>What you cannot do</h3>
          <p>
            There is no write path here. Status changes, new venues, and
            ingest live in the database repo. Placeholder screens in this app
            (Activity, Settings) are product skeleton only.
          </p>
        </article>
        <article className="card">
          <h3>Dataset snapshot</h3>
          <p>
            About 556 sourced rooms across 41 states. Ten jurisdictions were
            sourced and returned zero rooms: Alabama, Alaska, D.C., Georgia,
            Hawaii, Idaho, South Carolina, Tennessee, Utah, and Vermont.
          </p>
        </article>
        <article className="card">
          <h3>Placeholder copy</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
            posuere erat a ante venenatis dapibus posuere velit aliquet. This
            card exists so the About view feels like a real product page, not
            an empty route.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>API</h2>
        <p>
          Default base URL is <code>http://127.0.0.1:8000</code>, overridable
          with <code>NEXT_PUBLIC_API_BASE</code>. Endpoints used:{" "}
          <code>GET /health</code>, <code>GET /states</code>,{" "}
          <code>GET /rooms</code>, <code>GET /rooms/{"{slug}"}</code>.
        </p>
      </section>
    </>
  );
}
