import datetime as dt
import os
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


API_CALL_DELAY_SECONDS = 1.2
RATE_LIMIT_RETRY_SECONDS = 30
EMPTY_QUEUE_SLEEP_SECONDS = 30


class MatchNotFoundError(Exception):
	pass


def fetch_match_data(match_id: str, api_key: str) -> dict:
	url = f"https://europe.api.riotgames.com/tft/match/v1/matches/{match_id}"
	headers = {"X-Riot-Token": api_key}

	while True:
		print(f"Fetching match data for {match_id}...")
		response = requests.get(url, headers=headers, timeout=30)

		if response.status_code == 429:
			print("Rate limit hit (429). Sleeping for 30 seconds, then retrying...")
			time.sleep(RATE_LIMIT_RETRY_SECONDS)
			continue

		if response.status_code == 404:
			raise MatchNotFoundError(f"Match not found: {match_id}")

		if response.status_code >= 400:
			raise RuntimeError(
				f"Riot API error {response.status_code} for match {match_id}: {response.text}"
			)

		print("Match data fetched successfully.")
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


def claim_pending_match_id() -> str | None:
	conn = None
	cursor = None

	try:
		conn = mysql.connector.connect(**DB_CONFIG)
		conn.start_transaction()
		cursor = conn.cursor()

		cursor.execute(
			"SELECT match_id FROM matches_queue WHERE status = 'pending' LIMIT 1 FOR UPDATE"
		)
		row = cursor.fetchone()

		if row is None:
			conn.commit()
			return None

		match_id = row[0]
		cursor.execute(
			"UPDATE matches_queue SET status = 'processing' WHERE match_id = %s AND status = 'pending'",
			(match_id,),
		)

		if cursor.rowcount == 1:
			conn.commit()
			return match_id

		conn.rollback()
		return None
	finally:
		if cursor is not None:
			cursor.close()
		if conn is not None and conn.is_connected():
			conn.close()


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


def main() -> None:

	load_dotenv()
	riot_api_key = os.getenv("RIOT_API_KEY")
	if not riot_api_key:
		raise RuntimeError("RIOT_API_KEY is missing in .env file.")

	print("Miner worker started. Waiting for pending matches...")

	while True:
		match_id = claim_pending_match_id()

		if not match_id:
			print("No pending matches found. Sleeping for 30 seconds...")
			time.sleep(EMPTY_QUEUE_SLEEP_SECONDS)
			continue

		print(f"Claimed match {match_id}. Status set to processing.")

		try:
			time.sleep(API_CALL_DELAY_SECONDS)
			match_data = fetch_match_data(match_id, riot_api_key)
			save_match_data(match_data)
			update_queue_status(match_id, "completed")
			print(f"Successfully processed match {match_id}.")
		except MatchNotFoundError as exc:
			print(f"Match not found error: {exc}")
			update_queue_status(match_id, "failed")
		except Exception as exc:
			print(f"Processing failed for {match_id}: {exc}")
			update_queue_status(match_id, "failed")


if __name__ == "__main__":
	main()
