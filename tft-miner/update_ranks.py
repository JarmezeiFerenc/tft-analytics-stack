import datetime as dt
import os

import mysql.connector
from dotenv import load_dotenv

from crawler import DB_CONFIG, REGIONS, RegionRateLimiter, riot_get

load_dotenv()

API_CALL_DELAY_SECONDS = 1.2


def upsert_league_entries(
    connection: mysql.connector.MySQLConnection,
    region: str,
    tier: str,
    entries: list[dict],
) -> int:
    """INSERT … ON DUPLICATE KEY UPDATE for a batch of league entries."""
    sql = """
        INSERT INTO player_league_entries
            (puuid, region, queueType, tier, leaguePoints, wins, losses, lastSyncedAt, created_at, updated_at)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            tier          = VALUES(tier),
            leaguePoints  = VALUES(leaguePoints),
            wins          = VALUES(wins),
            losses        = VALUES(losses),
            lastSyncedAt  = VALUES(lastSyncedAt),
            updated_at    = VALUES(updated_at)
    """

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    rows_affected = 0

    with connection.cursor() as cursor:
        for entry in entries:
            puuid = entry.get("puuid")
            if not puuid:
                continue

            cursor.execute(sql, (
                puuid,
                region,
                "RANKED_TFT",
                tier,
                entry.get("leaguePoints", 0),
                entry.get("wins", 0),
                entry.get("losses", 0),
                now,
                now,
                now,
            ))
            rows_affected += cursor.rowcount

    connection.commit()
    return rows_affected


def sync_region(
    region: str,
    api_key: str,
    limiter: RegionRateLimiter,
    connection: mysql.connector.MySQLConnection,
) -> None:
    """Fetch Challenger tier for a single region and upsert."""
    url = f"https://{region}.api.riotgames.com/tft/league/v1/challenger"
    data = riot_get(url, api_key, limiter, region)

    entries = data.get("entries", []) if isinstance(data, dict) else []
    if not entries:
        print(f"[{region}] No challenger entries returned.")
        return

    affected = upsert_league_entries(connection, region, "CHALLENGER", entries)
    print(f"[{region}] Upserted {len(entries)} entries ({affected} rows affected).")


def main() -> None:
    api_key = os.getenv("RIOT_API_KEY")
    if not api_key:
        raise SystemExit("RIOT_API_KEY not set in environment.")

    connection = mysql.connector.connect(**DB_CONFIG)
    limiter = RegionRateLimiter(API_CALL_DELAY_SECONDS)

    try:
        for region in REGIONS:
            print(f"\n{'='*40}")
            print(f"Syncing {region.upper()} challenger league entries…")
            print(f"{'='*40}")
            try:
                sync_region(region, api_key, limiter, connection)
            except Exception as exc:
                print(f"[{region}] ERROR: {exc}")
    finally:
        connection.close()
        print("\nDone. Database connection closed.")


if __name__ == "__main__":
    main()
