<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ExplorerController extends Controller
{
    /**
     * Dynamic TFT Explorer query endpoint.
     *
     * Payload:
     * {
     *   "tab": "items" | "traits" | "single_items",
     *   "min_games": 1,
     *   "traits": ["TFT16_Enforcer"],
     *   "units": [
     *     { "id": "TFT16_Aatrox", "items": ["TFT_Item_BrambleVest"], "itemCount": 3 }
     *   ]
     * }
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tab'              => 'required|in:items,traits,single_items',
            'min_games'        => 'integer|min:1',
            'traits'           => 'array',
            'traits.*'         => 'string|max:100',
            'units'            => 'array|min:1',
            'units.*.id'       => 'required|string|max:100',
            'units.*.items'    => 'array|max:3',
            'units.*.items.*'  => 'string|max:100',
            'units.*.itemCount' => 'nullable|integer|min:0|max:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $tab      = $request->input('tab', 'items');
        $minGames = (int) $request->input('min_games', 1);
        $traits   = $request->input('traits', []);
        $units    = $request->input('units', []);

        $baseQuery = DB::table('match_participants as mp')
            ->select('mp.id as participant_id', 'mp.placement');

        foreach ($traits as $i => $traitName) {
            $alias = "pt_{$i}";
            $baseQuery->whereExists(function ($q) use ($traitName, $alias) {
                $q->select(DB::raw(1))
                  ->from("participant_traits as {$alias}")
                  ->whereColumn("{$alias}.participant_id", 'mp.id')
                  ->where("{$alias}.name", $traitName);
            });
        }

        foreach ($units as $j => $unitSpec) {
            $unitId    = $unitSpec['id'];
            $items     = $unitSpec['items'] ?? [];
            $itemCount = $unitSpec['itemCount'] ?? null;
            $alias     = "pu_{$j}";

            $baseQuery->whereExists(function ($q) use ($unitId, $items, $itemCount, $alias) {
                $q->select(DB::raw(1))
                  ->from("participant_units as {$alias}")
                  ->whereColumn("{$alias}.participant_id", 'mp.id')
                  ->where("{$alias}.character_id", $unitId);

                foreach ($items as $item) {
                    $q->where(function ($inner) use ($alias, $item) {
                        $inner->where("{$alias}.item_1", $item)
                              ->orWhere("{$alias}.item_2", $item)
                              ->orWhere("{$alias}.item_3", $item);
                    });
                }

                if ($itemCount !== null) {
                    $expr = "(CASE WHEN {$alias}.item_1 IS NOT NULL THEN 1 ELSE 0 END"
                          . " + CASE WHEN {$alias}.item_2 IS NOT NULL THEN 1 ELSE 0 END"
                          . " + CASE WHEN {$alias}.item_3 IS NOT NULL THEN 1 ELSE 0 END)";
                    $q->whereRaw("{$expr} = ?", [(int) $itemCount]);
                }
            });
        }

        $summaryRow = DB::query()
            ->fromSub($baseQuery, 'base')
            ->join('match_participants as s_mp', 's_mp.id', '=', 'base.participant_id')
            ->selectRaw('COUNT(*) as total_games')
            ->selectRaw('ROUND(AVG(base.placement), 2) as avg_placement')
            ->selectRaw('ROUND(100.0 * SUM(CASE WHEN base.placement <= 4 THEN 1 ELSE 0 END) / COUNT(*), 1) as top4_rate')
            ->selectRaw('ROUND(100.0 * SUM(CASE WHEN base.placement  = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as win_rate')
            ->selectRaw('ROUND(AVG(s_mp.level), 1) as avg_level')
            ->first();

        $summary = $summaryRow ? (array) $summaryRow : [
            'total_games'   => 0,
            'avg_placement' => 0,
            'top4_rate'     => 0,
            'win_rate'      => 0,
            'avg_level'     => 0,
        ];

        $tabData = match ($tab) {
            'items'        => $this->tabItemCombinations($baseQuery, $units, $minGames),
            'traits'       => $this->tabTraitStats($baseQuery, $minGames),
            'single_items' => $this->tabSingleItems($baseQuery, $units, $minGames),
        };

        return response()->json([
            'summary' => $summary,
            'results' => $tabData,
        ]);
    }

    /*  Item Combinations (BiS for first selected unit) */
    private function tabItemCombinations($baseQuery, array $units, int $minGames): array
    {
        $primaryUnit = $units[0]['id'] ?? null;

        if (!$primaryUnit) {
            return [];
        }

        $results = DB::query()
            ->fromSub($baseQuery, 'base')
            ->join('participant_units as pu', function ($join) use ($primaryUnit) {
                $join->on('pu.participant_id', '=', 'base.participant_id')
                     ->where('pu.character_id', $primaryUnit);
            })
            ->select(
                'pu.item_1',
                'pu.item_2',
                'pu.item_3',
                DB::raw('COUNT(*) as games_played'),
                DB::raw('ROUND(AVG(base.placement), 2) as avg_placement'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN base.placement <= 4 THEN 1 ELSE 0 END) / COUNT(*), 1) as top4_rate')
            )
            ->groupBy('pu.item_1', 'pu.item_2', 'pu.item_3')
            ->havingRaw('COUNT(*) >= ?', [$minGames])
            ->orderBy('avg_placement', 'asc')
            ->orderByDesc('games_played')
            ->limit(50)
            ->get()
            ->toArray();

        return $results;
    }

    /*  Trait Stats (co-occurring traits) */
    private function tabTraitStats($baseQuery, int $minGames): array
    {
        $results = DB::query()
            ->fromSub($baseQuery, 'base')
            ->join('participant_traits as pt', 'pt.participant_id', '=', 'base.participant_id')
            ->select(
                'pt.name as trait_name',
                DB::raw('MAX(pt.style) as max_style'),
                DB::raw('ROUND(AVG(pt.num_units), 1) as avg_units'),
                DB::raw('COUNT(*) as games_played'),
                DB::raw('ROUND(AVG(base.placement), 2) as avg_placement'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN base.placement <= 4 THEN 1 ELSE 0 END) / COUNT(*), 1) as top4_rate')
            )
            ->where('pt.tier_current', '>', 0)
            ->groupBy('pt.name')
            ->havingRaw('COUNT(*) >= ?', [$minGames])
            ->orderBy('avg_placement', 'asc')
            ->orderByDesc('games_played')
            ->limit(50)
            ->get()
            ->toArray();

        return $results;
    }

    /*  Single Item Performance */

    private function tabSingleItems($baseQuery, array $units, int $minGames): array
    {
        $primaryUnit = $units[0]['id'] ?? null;

        if (!$primaryUnit) {
            return [];
        }

        $sub = DB::query()
            ->fromSub($baseQuery, 'base')
            ->join('participant_units as pu', function ($join) use ($primaryUnit) {
                $join->on('pu.participant_id', '=', 'base.participant_id')
                     ->where('pu.character_id', $primaryUnit);
            })
            ->select(
                DB::raw('pu.item_1 as item_name'),
                'base.placement'
            )
            ->whereNotNull('pu.item_1')
            ->unionAll(
                DB::query()
                    ->fromSub($baseQuery, 'base2')
                    ->join('participant_units as pu2', function ($join) use ($primaryUnit) {
                        $join->on('pu2.participant_id', '=', 'base2.participant_id')
                             ->where('pu2.character_id', $primaryUnit);
                    })
                    ->select(DB::raw('pu2.item_2 as item_name'), 'base2.placement')
                    ->whereNotNull('pu2.item_2')
            )
            ->unionAll(
                DB::query()
                    ->fromSub($baseQuery, 'base3')
                    ->join('participant_units as pu3', function ($join) use ($primaryUnit) {
                        $join->on('pu3.participant_id', '=', 'base3.participant_id')
                             ->where('pu3.character_id', $primaryUnit);
                    })
                    ->select(DB::raw('pu3.item_3 as item_name'), 'base3.placement')
                    ->whereNotNull('pu3.item_3')
            );

        $results = DB::query()
            ->fromSub($sub, 'unpivoted')
            ->select(
                'unpivoted.item_name',
                DB::raw('COUNT(*) as games_played'),
                DB::raw('ROUND(AVG(unpivoted.placement), 2) as avg_placement'),
                DB::raw('ROUND(100.0 * SUM(CASE WHEN unpivoted.placement <= 4 THEN 1 ELSE 0 END) / COUNT(*), 1) as top4_rate')
            )
            ->groupBy('unpivoted.item_name')
            ->havingRaw('COUNT(*) >= ?', [$minGames])
            ->orderBy('avg_placement', 'asc')
            ->orderByDesc('games_played')
            ->limit(50)
            ->get()
            ->toArray();

        return $results;
    }
}
