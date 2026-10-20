export type Tournament = {
  slug: string;
  name: string;
  status: string;
  room_slug: string;
  room_name: string;
  also_rooms: { slug: string; name: string }[];
  city: string | null;
  state: string | null;
  start_date: string | null;
  start_time: string | null;
  start_at: string | null;
  tz: string | null;
  start_raw: string | null;
  recurrence: string;
  recurrence_days: string[];
  recurrence_raw: string | null;
  buy_in_cents: number | null;
  buy_in_prize_cents: number | null;
  buy_in_fee_cents: number | null;
  buy_in_raw: string | null;
  guarantee_cents: number | null;
  prize_pool_cents: number | null;
  prize_raw: string | null;
  game_type: string | null;
  game_name: string | null;
  game_raw: string | null;
  formats: string[];
  format_raw: string | null;
  starting_stack: number | null;
  registration_url: string | null;
  source_url: string;
  parse_method: string;
  raw_text: string | null;
  fetched_at: string;
};

/** Fields the list page needs (keeps the list payload small). */
export type TournamentRow = Pick<
  Tournament,
  | "slug" | "name" | "status" | "room_slug" | "room_name" | "city" | "state" | "start_date" | "start_time"
  | "recurrence" | "recurrence_days" | "buy_in_cents" | "guarantee_cents" | "game_type" | "formats" | "registration_url"
>;

export type Lookup = { slug: string; name: string };

export const DAY_NAMES: Record<string, string> = {
  MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun",
};
const DAY_INDEX: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const DAY_ORDER = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export function money(cents: number | null | undefined): string {
  if (cents == null) return "";
  const d = cents / 100;
  return d % 1 === 0 ? `$${d.toLocaleString("en-US")}` : `$${d.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function time12(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function dateLabel(d: string): string {
  const [y, mo, da] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, da));
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function whenLabel(t: Pick<Tournament, "start_date" | "start_time" | "recurrence" | "recurrence_days">): string {
  let day = "";
  if (t.start_date) day = dateLabel(t.start_date);
  else if (t.recurrence === "daily" || t.recurrence_days.length === 7) day = "Daily";
  else if (t.recurrence_days.length) {
    const prefix = t.recurrence === "monthly" ? "Monthly, " : "Every ";
    day = prefix + t.recurrence_days.map((d) => DAY_NAMES[d] ?? d).join(", ");
  } else day = "Date not listed";
  const tm = time12(t.start_time);
  return tm ? `${day} · ${tm}` : day;
}

export function sortKey(t: TournamentRow): string {
  if (t.start_date) return `0${t.start_date}${t.start_time ?? "99:99"}`;
  if (t.recurrence_days.length) {
    const first = Math.min(...t.recurrence_days.map((d) => DAY_ORDER.indexOf(d)).filter((i) => i >= 0));
    return `1${first}${t.start_time ?? "99:99"}`;
  }
  return `2${t.start_time ?? "99:99"}`;
}

/** Does the tournament run on any day in [from, to] (inclusive, YYYY-MM-DD)? */
export function inDateRange(t: TournamentRow, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  if (t.start_date) return (!from || t.start_date >= from) && (!to || t.start_date <= to);
  if (!t.recurrence_days.length) return false;
  const start = from ? new Date(`${from}T00:00:00Z`) : new Date();
  const end = to ? new Date(`${to}T00:00:00Z`) : new Date(start.getTime() + 6 * 864e5);
  const want = new Set(t.recurrence_days.map((d) => DAY_INDEX[d]));
  for (let i = 0, d = new Date(start); d <= end && i < 7; i++, d = new Date(d.getTime() + 864e5)) {
    if (want.has(d.getUTCDay())) return true;
  }
  return false;
}

export const PARSE_METHOD_LABEL: Record<string, string> = {
  jsonld_event: "schema.org Event data",
  calendar_widget: "iCal feed",
  html_table: "schedule table",
  listing_line: "schedule listing line",
  pokeratlas: "PokerAtlas",
};

export function toRow(t: Tournament): TournamentRow {
  return {
    slug: t.slug, name: t.name, status: t.status, room_slug: t.room_slug, room_name: t.room_name, city: t.city,
    state: t.state, start_date: t.start_date, start_time: t.start_time, recurrence: t.recurrence,
    recurrence_days: t.recurrence_days, buy_in_cents: t.buy_in_cents, guarantee_cents: t.guarantee_cents,
    game_type: t.game_type, formats: t.formats, registration_url: t.registration_url,
  };
}

