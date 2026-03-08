<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class PlayerProfileController extends Controller
{
    private const REGION_TO_CONTINENT = [
        'eun1' => 'europe',
        'euw1' => 'europe',
        'na1'  => 'americas',
        'br1'  => 'americas',
        'kr'   => 'asia',
    ];

    public function show(string $region, string $gameName, string $tagline): JsonResponse
    {
        try {
            $region    = strtolower($region);
            $apiKey    = config('services.riot.api_key');
            $continent = self::REGION_TO_CONTINENT[$region] ?? 'europe';

            if (!$apiKey) {
                return response()->json(['error' => 'Riot API key not configured.'], 500);
            }

            // 1. Resolve puuid
            $puuid = $this->resolvePuuid($continent, $gameName, $tagline, $apiKey);
            if (!$puuid) {
                return response()->json(['error' => 'Player not found on Riot servers.'], 404);
            }

            // 2. Fetch & upsert ranked data
            $leagueEntry = $this->syncLeagueEntry($region, $puuid, $apiKey);

            // 3. Fetch last 20 match IDs
            $matchIds = $this->fetchMatchIds($continent, $puuid, $apiKey, 20);

            // 4. Sync missing matches (all 8 participants)
            $this->syncMissingMatches($matchIds, $region, $apiKey);

            // 5. Build & return payload
            return response()->json($this->buildPayload(
                $puuid, $region, $gameName, $tagline, $leagueEntry, $matchIds
            ));
        } catch (ConnectionException $e) {
            Log::error('Riot API connection failure in player profile endpoint', ['message' => $e->getMessage()]);

            return response()->json([
                'error' => 'Cannot reach Riot API from backend (SSL/connection issue). Configure CA certificates for PHP cURL or set RIOT_HTTP_VERIFY=false for local dev.',
            ], 503);
        } catch (Throwable $e) {
            Log::error('Unhandled error in player profile endpoint', ['message' => $e->getMessage()]);

            return response()->json([
                'error' => 'Player profile sync failed unexpectedly.',
            ], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Riot API helpers                                                    */
    /* ------------------------------------------------------------------ */

    private function riot(string $url, string $apiKey): ?array
    {
        $response = Http::withOptions($this->httpOptions())
            ->withHeaders(['X-Riot-Token' => $apiKey])
            ->timeout(15)
            ->get($url);

        if ($response->status() === 429) {
            $retryAfter = (int) $response->header('Retry-After', 5);
            sleep(max($retryAfter, 1));
            return $this->riot($url, $apiKey);
        }

        if ($response->failed()) {
            Log::warning("Riot API error: {$response->status()} for {$url}");
            return null;
        }

        return $response->json();
    }

    private function httpOptions(): array
    {
        $verify = filter_var(config('services.riot.verify_ssl', true), FILTER_VALIDATE_BOOLEAN);
        $caBundle = config('services.riot.ca_bundle');

        if (is_string($caBundle) && $caBundle !== '') {
            return ['verify' => $caBundle];
        }

        return ['verify' => $verify];
    }

    private function resolvePuuid(string $continent, string $gameName, string $tagline, string $apiKey): ?string
    {
        $url = "https://{$continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/"
             . rawurlencode($gameName) . '/' . rawurlencode($tagline);

        return ($this->riot($url, $apiKey))['puuid'] ?? null;
    }

    private function syncLeagueEntry(string $region, string $puuid, string $apiKey): ?array
    {
        $url  = "https://{$region}.api.riotgames.com/tft/league/v1/entries/by-puuid/{$puuid}";
        $data = $this->riot($url, $apiKey);

        if (!$data || !is_array($data)) {
            return null;
        }

        $ranked = collect($data)->firstWhere('queueType', 'RANKED_TFT');
        if (!$ranked) {
            return null;
        }

        $now = now();
        DB::table('player_league_entries')->updateOrInsert(
            ['puuid' => $puuid, 'region' => $region, 'queueType' => 'RANKED_TFT'],
            [
                'tier'         => $ranked['tier'] ?? 'UNRANKED',
                'leaguePoints' => $ranked['leaguePoints'] ?? 0,
                'wins'         => $ranked['wins'] ?? 0,
                'losses'       => $ranked['losses'] ?? 0,
                'lastSyncedAt' => $now,
                'updated_at'   => $now,
                'created_at'   => $now,
            ]
        );

        return $ranked;
    }

    private function fetchMatchIds(string $continent, string $puuid, string $apiKey, int $count): array
    {
        $url = "https://{$continent}.api.riotgames.com/tft/match/v1/matches/by-puuid/{$puuid}/ids?start=0&count={$count}";
        return $this->riot($url, $apiKey) ?? [];
    }

    /* ------------------------------------------------------------------ */
    /*  Match sync — saves ALL 8 participants per match                    */
    /* ------------------------------------------------------------------ */

    private function syncMissingMatches(array $matchIds, string $region, string $apiKey): void
    {
        if (empty($matchIds)) {
            return;
        }

        $existing = DB::table('matches')->whereIn('id', $matchIds)->pluck('id')->toArray();
        $missing  = array_diff($matchIds, $existing);
        $continent = self::REGION_TO_CONTINENT[$region] ?? 'europe';

        foreach ($missing as $matchId) {
            $data = $this->riot(
                "https://{$continent}.api.riotgames.com/tft/match/v1/matches/{$matchId}",
                $apiKey
            );

            if ($data) {
                $this->saveFullMatch($data);
            }

            // Respect Riot rate limits
            usleep(1_200_000);
        }
    }

    private function saveFullMatch(array $matchData): void
    {
        $metadata = $matchData['metadata'] ?? [];
        $info     = $matchData['info'] ?? [];
        $matchId  = $metadata['match_id'] ?? null;

        if (!$matchId) {
            return;
        }

        DB::transaction(function () use ($matchId, $info) {
            if (DB::table('matches')->where('id', $matchId)->exists()) {
                return;
            }

            DB::table('matches')->insert([
                'id'                => $matchId,
                'game_datetime'     => $info['game_datetime'] ?? 0,
                'game_length'       => $info['game_length'] ?? 0,
                'game_version'      => $info['game_version'] ?? '',
                'tft_game_type'     => $info['tft_game_type'] ?? '',
                'tft_set_core_name' => $info['tft_set_core_name'] ?? '',
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);

            foreach ($info['participants'] ?? [] as $p) {
                $participantId = DB::table('match_participants')->insertGetId([
                    'match_id'                => $matchId,
                    'puuid'                   => $p['puuid'] ?? '',
                    'riotIdGameName'          => $p['riotIdGameName'] ?? null,
                    'riotIdTagline'           => $p['riotIdTagline'] ?? null,
                    'placement'               => $p['placement'] ?? 0,
                    'level'                   => $p['level'] ?? 0,
                    'last_round'              => $p['last_round'] ?? 0,
                    'gold_left'               => $p['gold_left'] ?? 0,
                    'time_eliminated'         => $p['time_eliminated'] ?? 0,
                    'total_damage_to_players' => $p['total_damage_to_players'] ?? 0,
                    'augments'                => json_encode($p['augments'] ?? []),
                    'created_at'              => now(),
                    'updated_at'              => now(),
                ]);

                foreach ($p['traits'] ?? [] as $trait) {
                    if (($trait['tier_current'] ?? 0) > 0) {
                        DB::table('participant_traits')->insert([
                            'participant_id' => $participantId,
                            'name'           => $trait['name'] ?? '',
                            'num_units'      => $trait['num_units'] ?? 0,
                            'style'          => $trait['style'] ?? 0,
                            'tier_current'   => $trait['tier_current'],
                            'created_at'     => now(),
                            'updated_at'     => now(),
                        ]);
                    }
                }

                foreach ($p['units'] ?? [] as $unit) {
                    $items = collect($unit['itemNames'] ?? [])->sort()->values();
                    DB::table('participant_units')->insert([
                        'participant_id' => $participantId,
                        'character_id'   => $unit['character_id'] ?? '',
                        'tier'           => $unit['tier'] ?? 0,
                        'rarity'         => $unit['rarity'] ?? 0,
                        'item_1'         => $items->get(0),
                        'item_2'         => $items->get(1),
                        'item_3'         => $items->get(2),
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Build JSON payload                                                 */
    /* ------------------------------------------------------------------ */

    private function buildPayload(
        string $puuid,
        string $region,
        string $gameName,
        string $tagline,
        ?array $leagueEntry,
        array $matchIds
    ): array {
        $wins  = $leagueEntry['wins'] ?? 0;
        $losses = $leagueEntry['losses'] ?? 0;
        $total = $wins + $losses;

        $profile = [
            'puuid'        => $puuid,
            'gameName'     => $gameName,
            'tagline'      => $tagline,
            'region'       => $region,
            'tier'         => $leagueEntry['tier'] ?? 'UNRANKED',
            'rank'         => $leagueEntry['rank'] ?? '',
            'leaguePoints' => $leagueEntry['leaguePoints'] ?? 0,
            'wins'         => $wins,
            'losses'       => $losses,
            'totalGames'   => $total,
            'winRate'      => $total > 0 ? round(100 * $wins / $total, 1) : 0,
        ];

        $matches = [];

        if (!empty($matchIds)) {
            $matchRows = DB::table('matches')
                ->whereIn('id', $matchIds)
                ->get()
                ->keyBy('id');

            $participants = DB::table('match_participants')
                ->whereIn('match_id', $matchIds)
                ->orderBy('placement')
                ->get();

            $pIds = $participants->pluck('id')->toArray();

            $allTraits = DB::table('participant_traits')
                ->whereIn('participant_id', $pIds)
                ->get()
                ->groupBy('participant_id');

            $allUnits = DB::table('participant_units')
                ->whereIn('participant_id', $pIds)
                ->get()
                ->groupBy('participant_id');

            $grouped = $participants->groupBy('match_id');

            foreach ($matchIds as $matchId) {
                $match = $matchRows->get($matchId);
                if (!$match) {
                    continue;
                }

                $players = $grouped->get($matchId, collect());

                $participantsArr = $players->map(function ($p) use ($allTraits, $allUnits) {
                    $traits = ($allTraits->get($p->id) ?? collect())->map(fn ($t) => [
                        'name'        => $t->name,
                        'numUnits'    => $t->num_units,
                        'style'       => $t->style,
                        'tierCurrent' => $t->tier_current,
                    ])->values()->toArray();

                    $units = ($allUnits->get($p->id) ?? collect())->map(fn ($u) => [
                        'characterId' => $u->character_id,
                        'tier'        => $u->tier,
                        'rarity'      => $u->rarity,
                        'items'       => array_values(array_filter([$u->item_1, $u->item_2, $u->item_3])),
                    ])->values()->toArray();

                    return [
                        'puuid'     => $p->puuid,
                        'gameName'  => $p->riotIdGameName,
                        'tagline'   => $p->riotIdTagline,
                        'placement' => $p->placement,
                        'level'     => $p->level,
                        'lastRound' => $p->last_round,
                        'goldLeft'  => $p->gold_left,
                        'traits'    => $traits,
                        'units'     => $units,
                    ];
                })->values()->toArray();

                $me = collect($participantsArr)->firstWhere('puuid', $puuid);

                $matches[] = [
                    'matchId'      => $matchId,
                    'gameLength'   => round($match->game_length),
                    'gameDatetime' => $match->game_datetime,
                    'gameVersion'  => $match->game_version,
                    'queueType'    => $match->tft_game_type,
                    'myPlacement'  => $me['placement'] ?? null,
                    'myTraits'     => $me['traits'] ?? [],
                    'myUnits'      => $me['units'] ?? [],
                    'participants' => $participantsArr,
                ];
            }
        }

        return [
            'profile' => $profile,
            'matches' => $matches,
        ];
    }
}
