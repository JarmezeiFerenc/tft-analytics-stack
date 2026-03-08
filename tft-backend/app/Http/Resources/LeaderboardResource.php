<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaderboardResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'gameName'      => (string) $this->riotIdGameName,
            'tagline'       => (string) $this->riotIdTagline,
            'region'        => (string) $this->region,
            'tier'          => (string) $this->tier,
            'leaguePoints'  => (int) $this->leaguePoints,
            'totalGames'    => (int) $this->totalGames,
            'winRate'       => (float) $this->winRate,
        ];
    }
}
