<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
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