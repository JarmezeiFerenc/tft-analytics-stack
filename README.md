# TFT Analytics Stack

I built this because I wanted full control over how TFT match data is collected, normalized, queried, and visualized.

Public tools are good at broad dashboards. They are not good at letting me ask very specific questions over a local dataset, re-run the pipeline when the meta shifts, and change the query model without waiting on someone else's product decisions.

This repo is split into three parts:

- `tft-miner`: Riot API ingestion and relational data processing
- `tft-backend`: Laravel API over the mined dataset
- `tft-frontend`: React UI for profile views, leaderboard, explorer, and planner work

## Technical Deep Dive

### Data Pipeline Ecosystem

I keep the pipeline split into three background processes because they solve different problems and they fail in different ways.

`crawler.py`

- Calls Riot endpoints for ranked players and match history.
- Pulls raw match IDs and writes them into `matches_queue`.
- Treats collection as an ingestion problem, not a stats problem.

`miner.py`

- Consumes queued match IDs.
- Fetches full match payloads.
- Normalizes the response into relational tables such as `matches`, `match_participants`, `participant_traits`, and `participant_units`.
- Does the heavy lifting once so the API does not have to rebuild aggregates on every request.

`update_ranks.py`

- Syncs current LP and challenger entry data into `player_league_entries`.
- Keeps rank data fresh independently of the slower match-ingestion cycle.

I do not run this work inside normal web requests for a reason. Riot calls are rate-limited, match payloads are large, and the transformation logic is not cheap. If I tried to fetch, normalize, and aggregate that data on-demand during HTTP requests, I would get slower APIs, harder failure recovery, and no clean way to reprocess historical data after schema or balance changes.

This split gives me three useful properties:

- ingestion can be retried independently
- mining can be tuned for throughput and idempotency
- rank sync can run on its own cadence without blocking analytics work

### Team Planner

I chose `@dnd-kit/core` instead of standard HTML5 drag-and-drop because I needed predictable pointer-level control inside a custom board layout.

The HTML5 API is fine for file drops and simple list reordering. It is not a good fit when the drag surface is a stylized game board with custom overlays, mobile support concerns, and drop logic that needs to stay under my control. `@dnd-kit/core` gives me that control directly through sensors, overlays, and collision strategies.

The hard part was not the drag token itself. The hard part was the mismatch between the geometry I render and the geometry the browser actually uses for hit testing. The board is presented as interlocking CSS hexagons, but the DOM still reasons about rectangles. That means I had to tune board spacing, row offsets, and collision behavior so drag intent feels correct even though the visible board is hexagonal and the pointer math underneath is not.

On state management, I took the pragmatic route. The current planner keeps a single canonical board state at the page boundary and passes only the minimum data needed into board and pool components. That avoids spraying transient drag state through the whole tree. If the planner grows into persisted comps, route-level sharing, or collaborative state, Zustand is the next extraction I would make. Right now I do not need a global store just to feel architecturally pure.

## Self-Correction & Refactoring

One recent bottleneck was the Explorer.

The UI started feeling laggy, and the backend responses were drifting into the kind of latency that makes a filter-heavy tool annoying to use. The underlying issue was not one bug. It was a stack of smaller problems.

On the frontend, I had let too much behavior accumulate inside large React components. I broke those views down so render boundaries were clearer and easier to reason about. I also fixed a silent debounce problem where effect timing and request state could interact badly enough to cause redundant fetches and feedback loops. The current explorer flow is explicit about request timing and abort behavior instead of hoping React timing will save it.

On the backend, I stopped pretending generic indexes were enough for compound analytics filters. Explorer queries are built around combinations of participant, unit, trait, and item predicates, so I added the indexes the workload actually needed. That includes composite B-Tree indexes such as:

- `participant_units(character_id, item_1)`
- `participant_units(character_id, item_2)`
- `participant_units(character_id, item_3)`
- `participant_units(participant_id, character_id)`
- `participant_traits(name, tier_current, participant_id)`

That changed the query profile materially. Requests that were taking seconds under filter-heavy explorer workloads dropped into millisecond territory once the planner, filter semantics, and index design were aligned with the actual access patterns.

## Local Operations (Docker Setup)

### Rules

- I use one root `.env` file for the entire stack.
- I do not keep separate `.env` files inside backend, frontend, or miner.
- Docker Compose injects the required values into each service.

### Prerequisites

- Docker Desktop with Compose enabled
- A valid `RIOT_API_KEY` in the root `.env`

### First-Time Setup

The repo already contains the single root `.env`. Start by reviewing it and replacing the Riot key if needed, then build the stack.

```bash
docker compose up -d --build
docker compose exec backend composer install
docker compose exec frontend npm install
docker compose exec backend php artisan migrate
```

What this does:

- builds the MySQL, Laravel, React, and Python images
- starts MySQL and imports `init.sql.gz` on first boot
- starts Laravel on `http://localhost:8000`
- starts Vite on `http://localhost:3000`
- applies database migrations against the MySQL container

### Daily Run

If the images are already built, this is enough:

```bash
docker compose up -d
```

That starts:

- MySQL on `localhost:3307`
- Laravel on `localhost:8000`
- the frontend Vite dev server on `localhost:3000`

If I stop the stack for the day:

```bash
docker compose down
```

If I need a clean rebuild after dependency or Dockerfile changes:

```bash
docker compose up -d --build --force-recreate
```

### Running the Pipeline Manually

The default `miner` service runs `update_ranks.py`. I keep crawler and miner worker as explicit one-shot jobs so I can trigger them manually when I want to refresh data.

Run the crawler:

```bash
docker compose --profile jobs run --rm crawler
```

Run the miner:

```bash
docker compose --profile jobs run --rm miner-worker
```

Run the rank updater:

```bash
docker compose run --rm miner
```

If I want to run the full pipeline in sequence:

```bash
docker compose --profile jobs run --rm crawler
docker compose --profile jobs run --rm miner-worker
docker compose run --rm miner
```

### Useful Service Commands

Open a shell in the backend container:

```bash
docker compose exec backend sh
```

Open a shell in the frontend container:

```bash
docker compose exec frontend sh
```

Open a shell in the Python image:

```bash
docker compose run --rm miner sh
```

Tail logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## API Surface

- `GET /api/leaderboard`
- `GET /api/player/{region}/{gameName}/{tagline}`
- `POST /api/explorer`
- `GET /api/matches`
- `GET /api/units/stats`

## Notes

- Riot API keys expire. If the pipeline suddenly starts failing, I check the key first.
- Explorer output is only as useful as the current local sample size.
- The MySQL import from `init.sql.gz` only happens on the first database initialization. If I need to re-import from scratch, I remove the volume and boot again.

```bash
docker compose down -v
docker compose up -d --build
```