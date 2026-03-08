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
        $namesSub = DB::table('match_participants')
            ->select(
                'puuid',
                DB::raw("LOWER(SUBSTRING_INDEX(match_id, '_', 1)) as region"),
                DB::raw('MAX(riotIdGameName) as riotIdGameName'),
                DB::raw('MAX(riotIdTagline) as riotIdTagline')
            )
            ->whereNotNull('riotIdGameName')
            ->whereNotNull('riotIdTagline')
            ->groupBy('puuid', DB::raw("LOWER(SUBSTRING_INDEX(match_id, '_', 1))"));

        $query = DB::table('player_league_entries as ple')
            ->joinSub($namesSub, 'names', function ($join) {
                $join->on('ple.puuid', '=', 'names.puuid')
                     ->on('ple.region', '=', 'names.region');
            })
            ->select(
                'names.riotIdGameName',
                'names.riotIdTagline',
                'ple.region',
                'ple.tier',
                'ple.leaguePoints',
                'ple.wins',
                'ple.losses',
                DB::raw('(ple.wins + ple.losses) as totalGames'),
                DB::raw('ROUND(IF(ple.wins + ple.losses > 0, 100 * ple.wins / (ple.wins + ple.losses), 0), 2) as winRate')
            );

        if ($request->filled('region') && $request->region !== 'Global') {
            $query->where('ple.region', strtolower($request->region));
        }

        $data = $query
            ->orderByDesc('ple.leaguePoints')
            ->limit(100)
            ->get();

        return LeaderboardResource::collection($data);
    }
}
