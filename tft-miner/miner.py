import datetime as dt
import os
import random
import threading
import time

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
EMPTY_QUEUE_SLEEP_SECONDS = 30
DEADLOCK_RETRY_MAX_ATTEMPTS = 5


class MatchNotFoundError(Exception):
    pass


def is_deadlock_error(exc: Exception) -> bool:
    return isinstance(exc, mysql.connector.Error) and getattr(exc, "errno", None) == 1213


def deadlock_backoff_sleep() -> None:
    time.sleep(random.uniform(0.1, 0.5))


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

        # Backfill region for old rows where possible.
        cursor.execute(
            """
            UPDATE matches_queue
            SET region = CASE
                WHEN UPPER(match_id) LIKE 'EUN1_%' THEN 'eun1'
                WHEN UPPER(match_id) LIKE 'EUW1_%' THEN 'euw1'
                WHEN UPPER(match_id) LIKE 'NA1_%' THEN 'na1'
                WHEN UPPER(match_id) LIKE 'BR1_%' THEN 'br1'
                WHEN UPPER(match_id) LIKE 'KR_%' THEN 'kr'
                ELSE region
            END
            WHERE region IS NULL OR region = ''
            """
        )

    connection.commit()
    print("Ensured 'matches_queue' schema with region column is ready.")


def fetch_match_data(
    match_id: str, region: str, api_key: str, limiter: RegionRateLimiter
) -> dict:
    continent = REGION_TO_CONTINENT[region]
    url = f"https://{continent}.api.riotgames.com/tft/match/v1/matches/{match_id}"
    headers = {"X-Riot-Token": api_key}

    while True:
        limiter.wait()
        print(f"[{region}] Fetching match data for {match_id}...")
        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 429:
            print(
                f"[{region}] Rate limit hit (429). Sleeping {RATE_LIMIT_RETRY_SECONDS}s before retry..."
            )
            time.sleep(RATE_LIMIT_RETRY_SECONDS)
            continue

        if response.status_code == 404:
            raise MatchNotFoundError(f"Match not found: {match_id}")

        if response.status_code >= 400:
            raise RuntimeError(
                f"[{region}] Riot API error {response.status_code} for match {match_id}: {response.text}"
            )

        print(f"[{region}] Match data fetched successfully for {match_id}.")
        return response.json()


def save_match_data(match_data: dict) -> None:
    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.start_transaction()
        cursor = conn.cursor()

        metadata = match_data.get("metadata", {})
        info = match_data.get("info", {})
        match_id = metadata.get("match_id")

        # Riot's game_datetime is typically epoch milliseconds.
        raw_game_datetime = info.get("game_datetime")
        game_datetime = None
        if raw_game_datetime is not None:
            game_datetime = dt.datetime.fromtimestamp(raw_game_datetime / 1000)

        match_sql = """
            INSERT IGNORE INTO matches (
                id,
                game_datetime,
                game_length,
                game_version,
                tft_game_type,
                tft_set_core_name
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            match_sql,
            (
                match_id,
                game_datetime,
                info.get("game_length"),
                info.get("game_version"),
                info.get("tft_game_type"),
                info.get("tft_set_core_name"),
            ),
        )

        participants = info.get("participants", [])
        participant_sql = """
            INSERT INTO match_participants (
                match_id,
                puuid,
                riotIdGameName,
                riotIdTagline,
                placement,
                level,
                last_round,
                gold_left,
                time_eliminated,
                total_damage_to_players
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                riotIdGameName = VALUES(riotIdGameName),
                riotIdTagline = VALUES(riotIdTagline),
                placement = VALUES(placement),
                level = VALUES(level),
                last_round = VALUES(last_round),
                gold_left = VALUES(gold_left),
                time_eliminated = VALUES(time_eliminated),
                total_damage_to_players = VALUES(total_damage_to_players)
        """

        trait_sql = """
            INSERT INTO participant_traits (
                participant_id,
                name,
                num_units,
                style,
                tier_current
            ) VALUES (%s, %s, %s, %s, %s)
        """

        unit_sql = """
            INSERT INTO participant_units (
                participant_id,
                character_id,
                tier,
                rarity,
                item_1,
                item_2,
                item_3
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        for participant in participants:
            cursor.execute(
                participant_sql,
                (
                    match_id,
                    participant.get("puuid"),
                    participant.get("riotIdGameName"),
                    participant.get("riotIdTagline"),
                    participant.get("placement"),
                    participant.get("level"),
                    participant.get("last_round"),
                    participant.get("gold_left"),
                    participant.get("time_eliminated"),
                    participant.get("total_damage_to_players"),
                ),
            )

            participant_id = cursor.lastrowid

            cursor.execute(
                "DELETE FROM participant_traits WHERE participant_id = %s",
                (participant_id,),
            )
            cursor.execute(
                "DELETE FROM participant_units WHERE participant_id = %s",
                (participant_id,),
            )

            for trait in participant.get("traits", []):
                tier_current = trait.get("tier_current", 0)
                if tier_current and tier_current > 0:
                    cursor.execute(
                        trait_sql,
                        (
                            participant_id,
                            trait.get("name"),
                            trait.get("num_units"),
                            trait.get("style"),
                            tier_current,
                        ),
                    )

            for unit in participant.get("units", []):
                item_names = sorted(unit.get("itemNames") or [])
                item_1 = item_names[0] if len(item_names) > 0 else None
                item_2 = item_names[1] if len(item_names) > 1 else None
                item_3 = item_names[2] if len(item_names) > 2 else None

                cursor.execute(
                    unit_sql,
                    (
                        participant_id,
                        unit.get("character_id"),
                        unit.get("tier"),
                        unit.get("rarity"),
                        item_1,
                        item_2,
                        item_3,
                    ),
                )

        conn.commit()
        print(f"Match {match_id} saved successfully.")

    except requests.RequestException as exc:
        if conn:
            conn.rollback()
        print(f"API error: {exc}")
        raise
    except mysql.connector.Error as exc:
        if conn:
            conn.rollback()
        print(f"Database error: {exc}")
        raise
    except Exception as exc:
        if conn:
            conn.rollback()
        print(f"Unexpected error: {exc}")
        raise
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None and conn.is_connected():
            conn.close()


def claim_pending_match_id(region: str) -> str | None:
    for attempt in range(1, DEADLOCK_RETRY_MAX_ATTEMPTS + 1):
        conn = None
        cursor = None

        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            conn.start_transaction()
            cursor = conn.cursor()

            # Short transaction scope: lock one row -> mark processing -> commit.
            cursor.execute(
                """
                SELECT match_id
                FROM matches_queue
                WHERE status = 'pending'
                  AND (
                        region = %s
                        OR ((region IS NULL OR region = '') AND UPPER(match_id) LIKE %s)
                      )
                LIMIT 1
                FOR UPDATE SKIP LOCKED
                """,
                (region, f"{region.upper()}_%"),
            )
            row = cursor.fetchone()

            if row is None:
                conn.commit()
                return None

            match_id = row[0]
            cursor.execute(
                """
                UPDATE matches_queue
                SET status = 'processing', region = %s
                WHERE match_id = %s AND status = 'pending'
                """,
                (region, match_id),
            )

            if cursor.rowcount == 1:
                conn.commit()
                return match_id

            conn.rollback()
            return None
        except mysql.connector.Error as exc:
            if conn is not None:
                conn.rollback()

            if is_deadlock_error(exc) and attempt < DEADLOCK_RETRY_MAX_ATTEMPTS:
                print(
                    f"[{region}] Deadlock while claiming queue row (attempt {attempt}/{DEADLOCK_RETRY_MAX_ATTEMPTS}). Retrying..."
                )
                deadlock_backoff_sleep()
                continue

            raise
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None and conn.is_connected():
                conn.close()

    return None


def update_queue_status(match_id: str, status: str) -> None:
    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE matches_queue SET status = %s WHERE match_id = %s",
            (status, match_id),
        )
        conn.commit()
        print(f"Queue status updated: {match_id} -> {status}")
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None and conn.is_connected():
            conn.close()


def update_queue_status_with_retry(match_id: str, status: str, region: str) -> bool:
    for attempt in range(1, DEADLOCK_RETRY_MAX_ATTEMPTS + 1):
        try:
            update_queue_status(match_id, status)
            return True
        except mysql.connector.Error as exc:
            if is_deadlock_error(exc) and attempt < DEADLOCK_RETRY_MAX_ATTEMPTS:
                print(
                    f"[{region}] Deadlock while setting {match_id} -> {status} "
                    f"(attempt {attempt}/{DEADLOCK_RETRY_MAX_ATTEMPTS}). Retrying..."
                )
                deadlock_backoff_sleep()
                continue
            print(f"[{region}] Failed to update queue status {match_id} -> {status}: {exc}")
            return False

    return False


def run_region_worker(region: str, api_key: str) -> None:
    if region not in REGION_TO_CONTINENT:
        print(f"[{region}] Unsupported region, worker exiting.")
        return

    limiter = RegionRateLimiter(API_CALL_DELAY_SECONDS)
    print(f"[{region}] Miner worker started.")

    while True:
        try:
            match_id = claim_pending_match_id(region)
        except mysql.connector.Error as exc:
            if is_deadlock_error(exc):
                print(f"[{region}] Deadlock while claiming pending match. Will retry loop without failing any match.")
                deadlock_backoff_sleep()
                continue

            print(f"[{region}] Database error while claiming pending match: {exc}")
            time.sleep(2)
            continue

        if not match_id:
            print(f"[{region}] No pending matches found. Sleeping for {EMPTY_QUEUE_SLEEP_SECONDS}s...")
            time.sleep(EMPTY_QUEUE_SLEEP_SECONDS)
            continue

        print(f"[{region}] Claimed match {match_id}. Status set to processing.")

        try:
            match_data = fetch_match_data(match_id, region, api_key, limiter)
            save_attempts = 0
            while True:
                try:
                    save_attempts += 1
                    save_match_data(match_data)
                    break
                except mysql.connector.Error as exc:
                    if is_deadlock_error(exc) and save_attempts < DEADLOCK_RETRY_MAX_ATTEMPTS:
                        print(
                            f"[{region}] Deadlock while saving {match_id} (attempt {save_attempts}/{DEADLOCK_RETRY_MAX_ATTEMPTS}). Retrying save..."
                        )
                        deadlock_backoff_sleep()
                        continue
                    raise

            if not update_queue_status_with_retry(match_id, "completed", region):
                print(
                    f"[{region}] Completed match data save for {match_id}, but could not set queue status. Leaving row for manual recovery."
                )
                continue

            print(f"[{region}] Successfully processed match {match_id}.")
        except MatchNotFoundError as exc:
            print(f"[{region}] Match not found error: {exc}")
            update_queue_status_with_retry(match_id, "failed", region)
        except mysql.connector.Error as exc:
            if is_deadlock_error(exc):
                print(
                    f"[{region}] Deadlock persisted while processing {match_id}. Leaving status as 'processing' for safe retry/recovery; not marking failed."
                )
                continue

            print(f"[{region}] Database error while processing {match_id}: {exc}")
            update_queue_status_with_retry(match_id, "failed", region)
        except Exception as exc:
            print(f"[{region}] Processing failed for {match_id}: {exc}")
            update_queue_status_with_retry(match_id, "failed", region)


def main() -> None:
    load_dotenv()
    riot_api_key = os.getenv("RIOT_API_KEY")
    if not riot_api_key:
        raise RuntimeError("RIOT_API_KEY is missing in .env file.")

    setup_conn = mysql.connector.connect(**DB_CONFIG)
    try:
        create_or_migrate_queue_table(setup_conn)
    finally:
        setup_conn.close()

    print(f"Starting miner threads for regions: {', '.join(REGIONS)}")

    threads: list[threading.Thread] = []
    for region in REGIONS:
        thread = threading.Thread(
            target=run_region_worker,
            args=(region, riot_api_key),
            name=f"miner-{region}",
            daemon=False,
        )
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()


if __name__ == "__main__":
    main()
