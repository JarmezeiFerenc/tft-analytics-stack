<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerLeagueEntry extends Model
{
    protected $table = 'player_league_entries';

    protected $fillable = [
        'puuid',
        'region',
        'queueType',
        'tier',
        'rank',
        'leaguePoints',
        'wins',
        'losses',
        'lastSyncedAt',
    ];

    protected $casts = [
        'leaguePoints' => 'integer',
        'wins' => 'integer',
        'losses' => 'integer',
        'lastSyncedAt' => 'datetime',
    ];
}
