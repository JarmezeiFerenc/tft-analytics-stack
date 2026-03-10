<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
    public function getAggregatedUnitStats()
    {
        $rows = DB::select(<<<'SQL'
            WITH unit_avg AS (
                SELECT
                    pu.character_id AS unit_id,
                    ROUND(AVG(mp.placement), 2) AS average_placement
                FROM participant_units pu
                INNER JOIN match_participants mp ON mp.id = pu.participant_id
                INNER JOIN matches m ON m.id = mp.match_id
                GROUP BY pu.character_id
            ),
            combo_counts AS (
                SELECT
                    pu.character_id AS unit_id,
                    CONCAT_WS(
                        '|',
                        LEAST(pu.item_1, pu.item_2, pu.item_3),
                        CASE
                            WHEN (pu.item_1 <= pu.item_2 AND pu.item_2 <= pu.item_3)
                              OR (pu.item_3 <= pu.item_2 AND pu.item_2 <= pu.item_1) THEN pu.item_2
                            WHEN (pu.item_2 <= pu.item_1 AND pu.item_1 <= pu.item_3)
                              OR (pu.item_3 <= pu.item_1 AND pu.item_1 <= pu.item_2) THEN pu.item_1
                            ELSE pu.item_3
                        END,
                        GREATEST(pu.item_1, pu.item_2, pu.item_3)
                    ) AS combo_key,
                    COUNT(*) AS games_played,
                    AVG(mp.placement) AS avg_placement
                FROM participant_units pu
                INNER JOIN match_participants mp ON mp.id = pu.participant_id
                INNER JOIN matches m ON m.id = mp.match_id
                WHERE pu.item_1 IS NOT NULL
                  AND pu.item_2 IS NOT NULL
                  AND pu.item_3 IS NOT NULL
                  AND TRIM(pu.item_1) <> ''
                  AND TRIM(pu.item_2) <> ''
                  AND TRIM(pu.item_3) <> ''
                  AND LOWER(pu.item_1) NOT LIKE 'tft_item_empty%'
                  AND LOWER(pu.item_2) NOT LIKE 'tft_item_empty%'
                  AND LOWER(pu.item_3) NOT LIKE 'tft_item_empty%'
                GROUP BY pu.character_id, combo_key
            ),
            ranked_combos AS (
                SELECT
                    cc.unit_id,
                    cc.combo_key,
                    ROW_NUMBER() OVER (
                        PARTITION BY cc.unit_id
                        ORDER BY cc.games_played DESC, cc.avg_placement ASC, cc.combo_key ASC
                    ) AS rn
                FROM combo_counts cc
            )
            SELECT
                ua.unit_id,
                ua.average_placement,
                rc.combo_key AS top_items_key
            FROM unit_avg ua
            LEFT JOIN ranked_combos rc
                ON rc.unit_id = ua.unit_id
               AND rc.rn = 1
            ORDER BY ua.unit_id
        SQL);

        $response = collect($rows)->map(function ($row) {
            return [
                'unit_id' => $row->unit_id,
                'average_placement' => (float) $row->average_placement,
                'top_items' => !empty($row->top_items_key)
                    ? array_values(array_filter(explode('|', $row->top_items_key)))
                    : [],
            ];
        })->values();

        return response()->json($response);
    }

    public function getUnitsStats()
    {
        $unitRows = DB::table('participant_units as pu')
            ->join('match_participants as mp', 'mp.id', '=', 'pu.participant_id')
            ->selectRaw('pu.character_id as character_id')
            ->selectRaw('ROUND(AVG(mp.placement), 2) as average_placement')
            ->selectRaw('ROUND(AVG(pu.rarity) + 1, 0) as cost')
            ->groupBy('pu.character_id')
            ->get();

        $topCombos = DB::table(DB::raw('(
            SELECT
                combos.character_id,
                combos.item_1,
                combos.item_2,
                combos.item_3,
                combos.games_played,
                ROW_NUMBER() OVER (
                    PARTITION BY combos.character_id
                    ORDER BY combos.games_played DESC, combos.avg_placement ASC
                ) as rn
            FROM (
                SELECT
                    pu.character_id,
                    LEAST(pu.item_1, pu.item_2, pu.item_3) as item_1,
                    GREATEST(pu.item_1, pu.item_2, pu.item_3) as item_3,
                    CASE
                        WHEN pu.item_1 <> LEAST(pu.item_1, pu.item_2, pu.item_3)
                         AND pu.item_1 <> GREATEST(pu.item_1, pu.item_2, pu.item_3) THEN pu.item_1
                        WHEN pu.item_2 <> LEAST(pu.item_1, pu.item_2, pu.item_3)
                         AND pu.item_2 <> GREATEST(pu.item_1, pu.item_2, pu.item_3) THEN pu.item_2
                        ELSE pu.item_3
                    END as item_2,
                    COUNT(*) as games_played,
                    AVG(mp.placement) as avg_placement
                FROM participant_units pu
                JOIN match_participants mp ON mp.id = pu.participant_id
                WHERE pu.item_1 IS NOT NULL
                  AND pu.item_2 IS NOT NULL
                  AND pu.item_3 IS NOT NULL
                  AND TRIM(pu.item_1) <> \'\'
                  AND TRIM(pu.item_2) <> \'\'
                  AND TRIM(pu.item_3) <> \'\'
                  AND LOWER(pu.item_1) NOT LIKE \'tft_item_empty%\'
                  AND LOWER(pu.item_2) NOT LIKE \'tft_item_empty%\'
                  AND LOWER(pu.item_3) NOT LIKE \'tft_item_empty%\'
                GROUP BY
                    pu.character_id,
                    LEAST(pu.item_1, pu.item_2, pu.item_3),
                    GREATEST(pu.item_1, pu.item_2, pu.item_3),
                    CASE
                        WHEN pu.item_1 <> LEAST(pu.item_1, pu.item_2, pu.item_3)
                         AND pu.item_1 <> GREATEST(pu.item_1, pu.item_2, pu.item_3) THEN pu.item_1
                        WHEN pu.item_2 <> LEAST(pu.item_1, pu.item_2, pu.item_3)
                         AND pu.item_2 <> GREATEST(pu.item_1, pu.item_2, pu.item_3) THEN pu.item_2
                        ELSE pu.item_3
                    END
            ) combos
        ) ranked_combos'))
            ->where('ranked_combos.rn', 1)
            ->get()
            ->keyBy('character_id');

        $results = $unitRows->map(function ($row) use ($topCombos) {
            $combo = $topCombos->get($row->character_id);

            return [
                'character_id' => $row->character_id,
                'average_placement' => (float) $row->average_placement,
                'cost' => $row->cost !== null ? (int) $row->cost : null,
                'most_built_item_combination' => $combo ? [
                    $combo->item_1,
                    $combo->item_2,
                    $combo->item_3,
                ] : null,
                'most_built_games_played' => $combo ? (int) $combo->games_played : 0,
            ];
        })->values();

        return response()->json($results);
    }

    // This endpoint returns the most common item combinations for a unit.
    public function getUnitStats(Request $request, $character_id)
    {
        $tier = $request->query('tier', 'any');
        $minGames = $request->query('min_games', 1);
        $sortBy = $request->query('sort_by', 'performance');

        if ($tier !== 'any' && !ctype_digit((string) $tier)) {
            return response()->json([
                'message' => "Invalid tier value. Use 'any' or a numeric tier."
            ], 422);
        }

        if (!ctype_digit((string) $minGames) || (int) $minGames < 1) {
            return response()->json([
                'message' => "Invalid min_games value. Use an integer >= 1."
            ], 422);
        }

        if (!in_array($sortBy, ['performance', 'popularity'], true)) {
            return response()->json([
                'message' => "Invalid sort_by value. Use 'performance' or 'popularity'."
            ], 422);
        }

        $minGames = (int) $minGames;

        $query = DB::table('participant_units')
            ->join('match_participants', 'participant_units.participant_id', '=', 'match_participants.id')
            ->where('participant_units.character_id', $character_id)
            ->select(
                'item_1', 'item_2', 'item_3',
                DB::raw('COUNT(*) as games_played'),
                DB::raw('ROUND(AVG(placement), 2) as avg_placement')
            )
            ->groupBy('item_1', 'item_2', 'item_3')
            ->havingRaw('COUNT(*) >= ?', [$minGames])
            ->limit(100);

        if ($sortBy === 'popularity') {
            $query
                ->orderBy('games_played', 'desc')
                ->orderBy('avg_placement', 'asc');
        } else {
            $query
                ->orderBy('avg_placement', 'asc')
                ->orderBy('games_played', 'desc');
        }

        if ($tier !== 'any') {
            $query->where('participant_units.tier', (int) $tier);
        }

        $stats = $query->get();

        return response()->json($stats);
    }
}