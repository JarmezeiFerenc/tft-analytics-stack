import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any

import mysql.connector
import requests
from dotenv import load_dotenv

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "",
    "database": "tft_data",
}

REGIONS = ["eun1", "euw1", "na1", "kr", "br1"]
REGION_TO_CONTINENT = {
    "eun1": "europe",
    "euw1": "europe",
    "na1": "americas",
    "br1": "americas",
    "kr": "asia",
}

API_CALL_DELAY_SECONDS = 1.2
RATE_LIMIT_RETRY_SECONDS = 30
TOP_PLAYERS_LIMIT = 200
MATCH_IDS_PER_PLAYER = 30


@dataclass
class CrawlStats:
    region: str
    players_processed: int = 0
    match_ids_seen: int = 0
    match_ids_inserted: int = 0


class RegionRateLimiter:
    def __init__(self, delay_seconds: float) -> None:
        self.delay_seconds = delay_seconds
        self.last_call_timestamp = 0.0

    def wait(self) -> None:
        now = time.time()
        elapsed = now - self.last_call_timestamp
        if elapsed < self.delay_seconds:
            time.sleep(self.delay_seconds - elapsed)
        self.last_call_timestamp = time.time()


def create_or_migrate_queue_table(connection: mysql.connector.MySQLConnection) -> None:
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS matches_queue (
        match_id VARCHAR(255) PRIMARY KEY,
        region VARCHAR(20) NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """

    with connection.cursor() as cursor:
        cursor.execute(create_table_sql)

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'matches_queue' AND COLUMN_NAME = 'region'
            """,
            (DB_CONFIG["database"],),
        )
        has_region_column = cursor.fetchone()[0] > 0

        if not has_region_column:
            cursor.execute("ALTER TABLE matches_queue ADD COLUMN region VARCHAR(20) NULL")

    connection.commit()
    print("Ensured 'matches_queue' schema with region column is ready.")


def riot_get(url: str, api_key: str, limiter: RegionRateLimiter, region: str) -> Any:
    headers = {"X-Riot-Token": api_key}

    while True:
        limiter.wait()
        print(f"[{region}] Calling Riot API: {url}")

        try:
            response = requests.get(url, headers=headers, timeout=30)
        except requests.RequestException as exc:
            print(f"[{region}] Network/API error: {exc}. Retrying in 5 seconds...")
            time.sleep(5)
            continue

        if response.status_code == 429:
            print(
                f"[{region}] Rate limit hit (429). Sleeping {RATE_LIMIT_RETRY_SECONDS}s before retry..."
            )
            time.sleep(RATE_LIMIT_RETRY_SECONDS)
            continue

        if response.status_code >= 400:
            raise RuntimeError(
                f"[{region}] Riot API error {response.status_code} for URL {url}: {response.text}"
            )

        return response.json()


def fetch_top_challenger_puuids(
    region: str, api_key: str, limiter: RegionRateLimiter
) -> list[str]:
    url = f"https://{region}.api.riotgames.com/tft/league/v1/challenger"
    data = riot_get(url, api_key, limiter, region)

    entries = data.get("entries", []) if isinstance(data, dict) else []
    puuids = [entry.get("puuid") for entry in entries if entry.get("puuid")]
    top_puuids = puuids[:TOP_PLAYERS_LIMIT]

    print(
        f"[{region}] Fetched {len(puuids)} challenger entries; using top {len(top_puuids)}."
    )
    return top_puuids


def fetch_match_ids_for_puuid(
    puuid: str, region: str, api_key: str, limiter: RegionRateLimiter
) -> list[str]:
    continent = REGION_TO_CONTINENT[region]
    url = (
        f"https://{continent}.api.riotgames.com/tft/match/v1/matches/by-puuid/"
        f"{puuid}/ids?start=0&count={MATCH_IDS_PER_PLAYER}"
    )
    data = riot_get(url, api_key, limiter, region)

    if not isinstance(data, list):
        raise RuntimeError(
            f"[{region}] Expected list of match IDs for puuid={puuid}, got {type(data)}"
        )

    return [match_id for match_id in data if isinstance(match_id, str)]


def insert_match_ids(
    connection: mysql.connector.MySQLConnection, region: str, match_ids: list[str]
) -> int:
    insert_sql = "INSERT IGNORE INTO matches_queue (match_id, region) VALUES (%s, %s)"
    inserted_count = 0

    with connection.cursor() as cursor:
        for match_id in match_ids:
            cursor.execute(insert_sql, (match_id, region))
            if cursor.rowcount > 0:
                inserted_count += 1

    connection.commit()
    return inserted_count


def crawl_region(region: str, api_key: str) -> CrawlStats:
    if region not in REGION_TO_CONTINENT:
        raise ValueError(f"Unsupported region '{region}'")

    print(f"[{region}] Thread started.")
    limiter = RegionRateLimiter(API_CALL_DELAY_SECONDS)
    connection = mysql.connector.connect(**DB_CONFIG)
    stats = CrawlStats(region=region)

    try:
        puuids = fetch_top_challenger_puuids(region, api_key, limiter)

        for index, puuid in enumerate(puuids, start=1):
            print(f"[{region}] [{index}/{len(puuids)}] Processing puuid={puuid}")

            try:
                match_ids = fetch_match_ids_for_puuid(puuid, region, api_key, limiter)
                inserted = insert_match_ids(connection, region, match_ids)

                stats.players_processed += 1
                stats.match_ids_seen += len(match_ids)
                stats.match_ids_inserted += inserted

                print(
                    f"[{region}] Match IDs fetched: {len(match_ids)}. "
                    f"Inserted new queue rows: {inserted}."
                )
            except Exception as exc:
                print(f"[{region}] Failed to process puuid={puuid}: {exc}")

        print(f"[{region}] Thread completed.")
        return stats
    finally:
        connection.close()
        print(f"[{region}] Database connection closed.")


def main() -> None:
    load_dotenv()
    api_key = os.getenv("RIOT_API_KEY")

    if not api_key:
        raise RuntimeError("RIOT_API_KEY is missing in .env file.")

    setup_conn = mysql.connector.connect(**DB_CONFIG)
    try:
        create_or_migrate_queue_table(setup_conn)
    finally:
        setup_conn.close()

    print(f"Starting crawler threads for regions: {', '.join(REGIONS)}")

    all_stats: list[CrawlStats] = []
    with ThreadPoolExecutor(max_workers=len(REGIONS), thread_name_prefix="crawler") as executor:
        futures = [executor.submit(crawl_region, region, api_key) for region in REGIONS]
        for future in futures:
            all_stats.append(future.result())

    print("\nCrawl complete.")
    print(f"Threads finished: {len(all_stats)}")
    print(f"Total players processed: {sum(s.players_processed for s in all_stats)}")
    print(f"Total match IDs seen: {sum(s.match_ids_seen for s in all_stats)}")
    print(f"Total new queue rows inserted: {sum(s.match_ids_inserted for s in all_stats)}")


if __name__ == "__main__":
    main()
