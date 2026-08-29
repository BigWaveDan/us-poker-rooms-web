import { US_JURISDICTIONS } from "@/lib/states";

const STATUSES = ["", "verified", "closed", "proposed", "rejected"];
const TYPES = ["", "card_room", "casino", "tribal_casino", "social_club", "other"];

export default function RoomFilters({
  state,
  city,
  q,
  status,
  type,
}: {
  state?: string;
  city?: string;
  q?: string;
  status?: string;
  type?: string;
}) {
  return (
    <form className="filters" method="get" action="/rooms">
      <input
        type="search"
        name="q"
        placeholder="Search name, city, slug"
        defaultValue={q ?? ""}
        aria-label="Search"
      />
      <select name="state" defaultValue={state ?? ""} aria-label="State">
        <option value="">All states</option>
        {US_JURISDICTIONS.map((j) => (
          <option key={j.code} value={j.code}>
            {j.code} — {j.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="city"
        placeholder="City"
        defaultValue={city ?? ""}
        aria-label="City"
      />
      <select name="status" defaultValue={status ?? ""} aria-label="Status">
        {STATUSES.map((s) => (
          <option key={s || "any"} value={s}>
            {s ? s : "Any status"}
          </option>
        ))}
      </select>
      <select name="type" defaultValue={type ?? ""} aria-label="Type">
        {TYPES.map((t) => (
          <option key={t || "any"} value={t}>
            {t ? t.replace("_", " ") : "Any type"}
          </option>
        ))}
      </select>
      <button className="btn" type="submit">
        Filter
      </button>
    </form>
  );
}
