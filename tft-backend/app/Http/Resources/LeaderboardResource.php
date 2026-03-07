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
            'gameName' => (string) $this->riotIdGameName,
            'tagline' => (string) $this->riotIdTagline,
            'region' => (string) $this->region,
            'matchesPlayed' => (int) $this->matchesPlayed,
            'top4Rate' => (float) $this->top4Rate,
            'winRate' => (float) $this->winRate,
        ];
    }
}
