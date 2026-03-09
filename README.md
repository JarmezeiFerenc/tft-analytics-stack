# TFT Analytics Stack

This repo is my personal TFT analysis pipeline.
I built it because I wanted to inspect my own matches with query depth similar to Tactics.tools and MetaTFT, but with filters that I can define and change myself.

## The Problem

I wanted a way to analyze my own matches with the same depth as MetaTFT, but with more custom filters.

Most public tools optimize for generic dashboards. I needed:
- deterministic filtering over exact unit + item + trait combinations
- a local dataset I can re-mine when patches change the meta
- full control over what is indexed and how rows are grouped

## Solution Overview

I split the project into 3 parts:
- `tft-miner`: pulls Riot data and writes normalized match tables
- `tft-backend`: serves query endpoints over mined data
- `tft-frontend`: UI for profile, match history, leaderboard, and explorer

Data flow:
1. `crawler.py` collects match IDs into `matches_queue`.
2. `miner.py` consumes the queue and writes `matches`, `match_participants`, `participant_traits`, `participant_units`.
3. Laravel APIs expose query endpoints.
4. React pages render filtered views.

## Technical Deep Dive

### Asset Context (CDragon `.tex` -> `.png`)

Riot/CDragon metadata contains icon paths that are not directly usable as browser image URLs in all cases. On top of that, naming conventions between the Riot Match API and CDragon are inconsistent. Units often have set-specific prefixes (e.g., `TFT16_Aatrox`), while items use generic IDs (`TFT_Item_BrambleVest`) or entirely different schemas for augments.

I normalize this in the frontend asset context (`tft-frontend/src/context/TftAssetContext.tsx`) and convert asset paths through `cdragonAssetPathToPngUrl(...)`.

What this gives me:
- one lookup map per asset type (`itemMap`, `unitMap`, `traitMap`) that acts as a bridge between Match API IDs and CDragon visual assets
- consistent lowercase keying to safely handle API naming anomalies and strip redundant prefixes
- a single conversion point instead of scattered string hacks in UI components

I load `https://raw.communitydragon.org/latest/cdragon/tft/en_us.json`, pick the latest set, and hydrate maps once in context.

### Explorer Backend (why subqueries over joins)

The Explorer endpoint (`tft-backend/app/Http/Controllers/Api/ExplorerController.php`) uses `whereExists` subqueries to build the base participant filter.

I chose subqueries over large multi-join filters because:
- joins with many unit/trait/item constraints can multiply rows and force extra dedup logic
- each `whereExists` clause behaves like a boolean predicate on a participant row, which maps directly to the filter semantics
- it keeps "must include this trait/unit/item" constraints composable without exploding the join graph

After the base participant set is defined, I aggregate tabs (`items`, `traits`, `single_items`) from `fromSub($baseQuery, 'base')`.
That gives predictable grouping and easier SQL reasoning when I tune performance.


## Run Locally

### 1. Prerequisites

- Node.js 20+
- PHP 8.2+
- Composer 2+
- Python 3.11+
- MySQL 8+

### 2. Create the database

Create a MySQL database named `tft_data`.

Example SQL:

```sql
CREATE DATABASE tft_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Important: the Python miner currently has DB config hardcoded in code (`tft-miner/crawler.py`, `tft-miner/miner.py`) as:
- host: `127.0.0.1`
- user: `root`
- password: empty
- database: `tft_data`

If your local credentials differ, edit `DB_CONFIG` in those files.

### 3. Backend setup (`tft-backend`)

```bash
cd tft-backend
composer install
cp .env.example .env
php artisan key:generate
```

Then edit `.env`:
- set DB to mysql
- set `DB_HOST`, `DB_PORT`, `DB_DATABASE=tft_data`, `DB_USERNAME`, `DB_PASSWORD`
- set `RIOT_API_KEY=...`
- optional local SSL workaround: `RIOT_HTTP_VERIFY=false`

Run migrations:

```bash
php artisan migrate
```

Start backend:

```bash
php artisan serve
```

### 4. Frontend setup (`tft-frontend`)

```bash
cd tft-frontend
npm install
npm run dev
```

### 5. Miner setup (`tft-miner`)

Create and activate virtualenv:

```bash
cd tft-miner
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Install deps (if `requirements.txt` is empty in your branch, install directly):

```bash
pip install requests mysql-connector-python python-dotenv
```

Create `tft-miner/.env` with:

```env
RIOT_API_KEY=your_riot_api_key
```

### 6. Initial data bootstrap (order matters)

1. Crawl match IDs into queue:

```bash
cd tft-miner
python .\crawler.py
```

2. Mine queued matches into normalized tables:

```bash
python .\miner.py
```

3. Sync ranked entries used by leaderboard/profile:

```bash
python .\update_ranks.py
```

The first full run takes time because of Riot rate limiting.

### 7. Daily refresh workflow

When I want fresh data, I rerun:

```bash
cd tft-miner
python .\crawler.py
python .\miner.py
python .\update_ranks.py
```

## API surface (current)

- `GET /api/leaderboard`
- `GET /api/player/{region}/{gameName}/{tagline}`
- `POST /api/explorer`
- `GET /api/matches`

## Notes

- Riot API keys expire; if requests suddenly fail, refresh the key first.
- Explorer queries are only as good as the local mined sample size.
- If profile sync fails with SSL issues in local dev, use CA bundle config or `RIOT_HTTP_VERIFY=false`.
