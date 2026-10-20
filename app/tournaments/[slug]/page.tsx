import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DAY_NAMES,
  FORMATS,
  PARSE_METHOD_LABEL,
  TOURNAMENTS,
  dateLabel,
  money,
  time12,
  tournamentBySlug,
} from "@/lib/tournaments";

export const dynamicParams = false;

export function generateStaticParams() {
  // static export needs at least one param; the sentinel 404s if the snapshot is empty
  return TOURNAMENTS.length ? TOURNAMENTS.map((t) => ({ slug: t.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = tournamentBySlug(slug);
  return { title: t ? `${t.name} · ${t.room_name}` : "Tournament" };
}

function host(u: string) {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export default async function TournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = tournamentBySlug(slug);
  if (!t) notFound();

  const fmt = t.formats.map((f) => FORMATS.find((x) => x.slug === f)?.name ?? f);
  const days =
    t.recurrence === "daily" || t.recurrence_days.length === 7
      ? "Daily"
      : t.recurrence_days.map((d) => DAY_NAMES[d] ?? d).join(", ");
  const rows: [string, React.ReactNode][] = [];
  const add = (k: string, v: React.ReactNode) => {
    if (v !== null && v !== undefined && v !== "") rows.push([k, v]);
  };
  add("Status", t.status === "cancelled" ? <span className="badge closed">cancelled</span> : null);
  add("Date", t.start_date ? dateLabel(t.start_date) : null);
  add("Runs", t.start_date ? null : days ? `${t.recurrence === "monthly" ? "Monthly" : "Weekly"}: ${days}` : null);
  add("Start time", t.start_time ? `${time12(t.start_time)}${t.tz ? ` (${t.tz})` : ""}` : null);
  add("Schedule as listed", t.start_raw);
  add("Recurrence as listed", t.start_date ? null : t.recurrence_raw);
  add(
    "Buy-in",
    t.buy_in_cents != null
      ? `${money(t.buy_in_cents)}${t.buy_in_fee_cents != null ? ` (${money(t.buy_in_prize_cents)} prize pool + ${money(t.buy_in_fee_cents)} fee)` : ""}`
      : null,
  );
  add("Buy-in as listed", t.buy_in_raw && t.buy_in_cents == null ? t.buy_in_raw : null);
  add("Guarantee", t.guarantee_cents != null ? money(t.guarantee_cents) : null);
  add("Prize pool", t.prize_pool_cents != null ? money(t.prize_pool_cents) : null);
  add("Prize as listed", t.prize_raw && t.guarantee_cents == null && t.prize_pool_cents == null ? t.prize_raw : null);
  add("Game", t.game_type && t.game_type !== "other" ? t.game_name : null);
  add("Format", fmt.length ? fmt.join(", ") : null);
  add("Starting stack", t.starting_stack != null ? t.starting_stack.toLocaleString("en-US") : null);

  return (
    <article className="td">
      <p className="meta td-crumb">
        <Link href="/tournaments/">Tournaments</Link>
        {t.state ? <> · <Link href={`/tournaments/?state=${t.state}`}>{t.state}</Link></> : null}
      </p>
      <h1>{t.name}</h1>
      <p className="td-room">
        <Link href={`/rooms/${t.room_slug}/`}>{t.room_name}</Link>
        <span className="meta">{[t.city, t.state].filter(Boolean).join(", ")}</span>
      </p>
      {t.also_rooms.length > 0 && (
        <p className="meta td-also">
          Also listed under:{" "}
          {t.also_rooms.map((r, i) => (
            <span key={r.slug}>
              {i > 0 ? ", " : ""}
              <Link href={`/rooms/${r.slug}/`}>{r.name}</Link>
            </span>
          ))}
        </p>
      )}

      {t.registration_url && (
        <p>
          <a className="btn td-register" href={t.registration_url} target="_blank" rel="nofollow noopener">
            Register
          </a>
        </p>
      )}

      <dl className="dl">
        {rows.map(([k, v]) => (
          <div className="td-pair" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <h2>Source</h2>
      <ul className="sources">
        <li>
          <a href={t.source_url} target="_blank" rel="nofollow noopener" className="td-src">
            {host(t.source_url)}
          </a>
          <div className="meta">
            {PARSE_METHOD_LABEL[t.parse_method] ?? t.parse_method} · fetched {t.fetched_at.slice(0, 10)}
          </div>
        </li>
      </ul>
      {t.raw_text && (
        <details className="td-raw">
          <summary>Source text</summary>
          <pre>{t.raw_text}</pre>
        </details>
      )}
    </article>
  );
}
