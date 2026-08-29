# US Poker Rooms (web)

Next.js App Router UI over the read-only US live poker rooms API. This is a
data-collection browser: it does **not** invent rooms. Coverage gaps stay
visible.

## Run

The API lives in the database repo (`us-poker-rooms`). Start it first:

```bash
# in us-poker-rooms
python3 -m venv .venv
.venv/bin/pip install fastapi uvicorn
.venv/bin/uvicorn api:app --host 0.0.0.0 --port 8000
```

Then this app (package scripts: install, dev, build). Optional env file:

```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

Default API base is `http://127.0.0.1:8000`. Copy `.env.example` to `.env.local`
to override.

## Pages

| Route | Role |
| --- | --- |
| `/` | Home — product shell plus live coverage snapshot |
| `/rooms` | Directory: state coverage (sourced zeros highlighted), search/filter list |
| `/rooms/[slug]` | Room detail: address, hours, games, source URLs |
| `/activity` | Placeholder collection feed / empty states |
| `/about` | Product notes |
| `/settings` | Preference skeleton + API base URL |

Activity, About, and Settings are generic product filler. They do not add fake
poker rooms.

## API

`NEXT_PUBLIC_API_BASE` (default `http://127.0.0.1:8000`)

- `GET /health`
- `GET /states`
- `GET /rooms?state=&city=&q=&status=&type=&limit=&offset=`
- `GET /rooms/{slug}` (includes `sources`)

If the API is down, a tiny fixture of **real** sourced rooms still renders so
the UI is not blank.

## Sourced zeros

These jurisdictions were collected and returned no rooms: AL, AK, DC, GA, HI,
ID, SC, TN, UT, VT.
