<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    public function index()
    {
        $matches = DB::table('matches')
            ->orderBy('game_datetime', 'desc')
            ->limit(10)
            ->get();

        return response()->json($matches);
    }
}