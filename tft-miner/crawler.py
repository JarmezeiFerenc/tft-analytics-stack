import os
import time
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

API_CALL_DELAY_SECONDS = 1.2
RATE_LIMIT_RETRY_SECONDS = 30
TOP_PLAYERS_LIMIT = 100
MATCH_IDS_PER_PLAYER = 20

_last_api_call_timestamp = 0.0


def create_queue_table(connection: mysql.connector.MySQLConnection) -> None:
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS matches_queue (
        match_id VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """

    with connection.cursor() as cursor:
        cursor.execute(create_table_sql)
    connection.commit()
    print("Ensured table 'matches_queue' exists.")


def wait_between_api_calls() -> None:
    global _last_api_call_timestamp

    now = time.time()
    elapsed = now - _last_api_call_timestamp
    if elapsed < API_CALL_DELAY_SECONDS:
        sleep_time = API_CALL_DELAY_SECONDS - elapsed
        time.sleep(sleep_time)

    _last_api_call_timestamp = time.time()


def riot_get(url: str, api_key: str) -> Any:
    headers = {"X-Riot-Token": api_key}

    while True:
        wait_between_api_calls()
        print(f"Calling Riot API: {url}")

        try:
            response = requests.get(url, headers=headers, timeout=30)
        except requests.RequestException as exc:
            print(f"Network/API request error: {exc}. Retrying in 5 seconds...")
            time.sleep(5)
            continue

        if response.status_code == 429:
            print("Rate limit hit (429). Sleeping for 30 seconds before retry...")
            time.sleep(RATE_LIMIT_RETRY_SECONDS)
            continue

        if response.status_code >= 400:
            raise RuntimeError(
                f"Riot API error {response.status_code} for URL {url}: {response.text}"
            )

        return response.json()


def fetch_top_challenger_puuids(api_key: str) -> list[str]:
    url = "https://euw1.api.riotgames.com/tft/league/v1/challenger"
    data = riot_get(url, api_key)

    entries = data.get("entries", []) if isinstance(data, dict) else []
    puuids = [entry.get("puuid") for entry in entries if entry.get("puuid")]
    top_puuids = puuids[:TOP_PLAYERS_LIMIT]

    print(
        f"Fetched {len(puuids)} challenger entries with PUUID, using top {len(top_puuids)} players."
    )
    return top_puuids


def fetch_match_ids_for_puuid(puuid: str, api_key: str) -> list[str]:
    url = (
        "https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/"
        f"{puuid}/ids?start=0&count={MATCH_IDS_PER_PLAYER}"
    )
    data = riot_get(url, api_key)

    if not isinstance(data, list):
        raise RuntimeError(f"Expected list of match IDs for puuid={puuid}, got {type(data)}")

    return [match_id for match_id in data if isinstance(match_id, str)]


def insert_match_ids(connection: mysql.connector.MySQLConnection, match_ids: list[str]) -> int:
    insert_sql = "INSERT IGNORE INTO matches_queue (match_id) VALUES (%s)"
    inserted_count = 0

    with connection.cursor() as cursor:
        for match_id in match_ids:
            cursor.execute(insert_sql, (match_id,))
            if cursor.rowcount > 0:
                inserted_count += 1

    connection.commit()
    return inserted_count


def main() -> None:
    load_dotenv()
    api_key = os.getenv("RIOT_API_KEY")

    if not api_key:
        raise RuntimeError("RIOT_API_KEY is missing in .env file.")

    connection = mysql.connector.connect(**DB_CONFIG)

    try:
        create_queue_table(connection)

        puuids = fetch_top_challenger_puuids(api_key)
        total_seen_matches = 0
        total_inserted_matches = 0

        for index, puuid in enumerate(puuids, start=1):
            print(f"[{index}/{len(puuids)}] Processing puuid={puuid}")

            try:
                match_ids = fetch_match_ids_for_puuid(puuid, api_key)
                inserted = insert_match_ids(connection, match_ids)

                total_seen_matches += len(match_ids)
                total_inserted_matches += inserted

                print(
                    f"  -> Match IDs fetched: {len(match_ids)}. Inserted new queue rows: {inserted}."
                )
            except Exception as exc:
                print(f"  -> Failed to process puuid={puuid}: {exc}")

        print("Done.")
        print(f"Total match IDs seen: {total_seen_matches}")
        print(f"Total newly inserted in queue: {total_inserted_matches}")

    finally:
        connection.close()
        print("Database connection closed.")


if __name__ == "__main__":
    main()
