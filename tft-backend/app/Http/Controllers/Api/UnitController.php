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
}