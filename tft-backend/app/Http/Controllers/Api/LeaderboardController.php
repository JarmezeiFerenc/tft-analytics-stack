<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaderboardResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $regionSql = "LOWER(SUBSTRING_INDEX(match_id, '_', 1))";

        $query = DB::table('match_participants')
            ->select(
                'riotIdGameName',
                'riotIdTagline',
                DB::raw("$regionSql as region"),
                DB::raw('COUNT(*) as matchesPlayed'),
                DB::raw('ROUND(100 * SUM(CASE WHEN placement <= 4 THEN 1 ELSE 0 END) / COUNT(*), 2) as top4Rate'),
                DB::raw('ROUND(100 * SUM(CASE WHEN placement = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as winRate')
            )
            ->whereNotNull('riotIdGameName')
            ->whereNotNull('riotIdTagline');

        if ($request->has('region') && $request->region !== 'Global') {
            $query->whereRaw("$regionSql = ?", [strtolower($request->region)]);
        }

        $data = $query->groupBy('riotIdGameName', 'riotIdTagline', DB::raw($regionSql))
                    ->orderBy('winRate', 'desc')
                    ->orderBy('matchesPlayed', 'desc')
                    ->limit(100)
                    ->get();

        return LeaderboardResource::collection($data);
    }
}
