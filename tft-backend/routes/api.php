<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExplorerController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\PlayerProfileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/matches', [MatchController::class, 'index']);
Route::get('/units/stats', [UnitController::class, 'getAggregatedUnitStats']);
Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::get('/player/{region}/{gameName}/{tagline}', [PlayerProfileController::class, 'show']);
Route::post('/explorer', [ExplorerController::class, 'index']);