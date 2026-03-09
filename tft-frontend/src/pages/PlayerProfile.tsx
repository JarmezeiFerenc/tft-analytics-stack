import { ChevronDown, Clock, Loader2, Search, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TftUnitImage } from '../components/TftUnitImage';
import { TftItemImage } from '../components/TftItemImage';
import { TftTraitIcon } from '../components/TftTraitIcon';

interface ProfileData {
  puuid: string;
  gameName: string;
  tagline: string;
  region: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

interface TraitData {
  name: string;
  numUnits: number;
  style: number;
  tierCurrent: number;
}

interface UnitData {
  characterId: string;
  tier: number;
  rarity: number;
  items: string[];
}

interface ParticipantData {
  puuid: string;
  gameName: string | null;
  tagline: string | null;
  placement: number;
  level: number;
  lastRound: number;
  goldLeft: number;
  traits: TraitData[];
  units: UnitData[];
}

interface MatchData {
  matchId: string;
  gameLength: number;
  gameDatetime: number;
  gameVersion: string;
  queueType: string;
  myPlacement: number | null;
  myTraits: TraitData[];
  myUnits: UnitData[];
  participants: ParticipantData[];
}

interface ApiResponse {
  profile: ProfileData;
  matches: MatchData[];
}

const API_BASE = 'http://localhost:8000/api';

const REGION_OPTIONS = [
  { label: 'EUNE', value: 'eun1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'NA', value: 'na1' },
  { label: 'BR', value: 'br1' },
  { label: 'KR', value: 'kr' },
];

const RARITY_RING: Record<number, string> = {
  0: 'ring-zinc-600',
  1: 'ring-green-500',
  2: 'ring-blue-500',
  4: 'ring-purple-500',
  6: 'ring-yellow-500',
};

function placementColor(p: number): string {
  if (p === 1) return 'text-yellow-300';
  if (p <= 4) return 'text-green-400';
  return 'text-red-400';
}

function placementBg(p: number): string {
  if (p === 1) return 'border-yellow-500/60 bg-yellow-500/15';
  if (p <= 4) return 'border-green-500/40 bg-green-500/10';
  return 'border-red-500/30 bg-red-500/10';
}

function formatGameLength(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function regionLabel(value: string): string {
  const found = REGION_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value.toUpperCase();
}

function sortTraitsForDisplay(traits: TraitData[]): TraitData[] {
  return [...traits]
    .filter((trait) => trait.style > 0)
    .sort((a, b) => {
      if (b.style !== a.style) return b.style - a.style;
      return b.numUnits - a.numUnits;
    });
}

/*  Small sub-components */

function UnitIcon({ unit }: { unit: UnitData }) {
  const ring = RARITY_RING[unit.rarity] ?? 'ring-zinc-600';
  return (
    <div className="group relative flex flex-col items-center">
      <div className={`h-8 w-8 overflow-hidden rounded-md ring-2 ${ring}`}>
        <TftUnitImage
          apiName={unit.characterId}
          className="h-full w-full object-cover"
        />
      </div>
      {unit.tier > 1 && (
        <div className="mt-0.5 flex gap-px">
          {Array.from({ length: unit.tier }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-yellow-400" />
          ))}
        </div>
      )}
      {unit.items.length > 0 && (
        <div className="mt-0.5 flex gap-px">
          {unit.items.map((item, i) => (
            <TftItemImage
              key={i}
              apiName={item}
              className="h-3.5 w-3.5 rounded-sm object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/*  Expandable match row  */

function MatchRow({ match, searchedPuuid }: { match: MatchData; searchedPuuid: string }) {
  const [open, setOpen] = useState(false);
  const placement = match.myPlacement ?? 0;
  const topTraits = sortTraitsForDisplay(match.myTraits);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800/50"
      >
        {/* Placement */}
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${placementBg(placement)} ${placementColor(placement)}`}
        >
          {placement || '?'}
        </span>

        {/* Units */}
        <div className="flex flex-wrap items-start gap-1.5">
          {match.myUnits.map((u, i) => (
            <UnitIcon key={i} unit={u} />
          ))}
        </div>

        {/* Traits */}
        <div className="ml-auto hidden flex-wrap gap-1 sm:flex">
          {topTraits.map((trait, i) => (
            <TftTraitIcon
              key={`${trait.name}-${trait.style}-${i}`}
              apiName={trait.name}
              style={trait.style}
              numUnits={trait.numUnits}
            />
          ))}
        </div>

        {/* Meta */}
        <div className="ml-3 flex shrink-0 items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatGameLength(match.gameLength)}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded, all 8 participants */}
      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950/50 px-2 py-2 sm:px-4 sm:py-3">
          <div className="space-y-1.5">
            {match.participants.map((p, i) => {
              const isMe = p.puuid === searchedPuuid;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${isMe ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : 'hover:bg-zinc-800/40'}`}
                >
                  {/* Placement */}
                  <span className={`w-5 shrink-0 text-center font-bold ${placementColor(p.placement)}`}>
                    {p.placement}
                  </span>

                  {/* Name */}
                  <div className="w-32 shrink-0 truncate">
                    <span className="text-zinc-100">{p.gameName ?? 'Unknown'}</span>
                    <span className="text-zinc-500 text-xs"> #{p.tagline ?? '???'}</span>
                  </div>

                  {/* Units */}
                  <div className="flex flex-1 flex-wrap items-start gap-1.5">
                    {p.units.map((u, j) => (
                      <UnitIcon key={j} unit={u} />
                    ))}
                  </div>

                  {/* Traits */}
                  <div className="hidden flex-wrap justify-end gap-1 lg:flex">
                    {sortTraitsForDisplay(p.traits).map((trait, k) => (
                      <TftTraitIcon
                        key={`${trait.name}-${trait.style}-${k}`}
                        apiName={trait.name}
                        style={trait.style}
                        numUnits={trait.numUnits}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerProfile() {
  const { region: paramRegion, gameName: paramName, tagline: paramTag } = useParams();
  const [searchParams] = useSearchParams();

  const [formRegion, setFormRegion] = useState(paramRegion ?? searchParams.get('region') ?? 'euw1');
  const [formName, setFormName] = useState(paramName ?? searchParams.get('name') ?? '');
  const [formTag, setFormTag] = useState(paramTag ?? searchParams.get('tag') ?? '');

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupPlayer(region: string, name: string, tag: string) {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `${API_BASE}/player/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${response.status}`);
      }

      const json = (await response.json()) as ApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = formName.trim();
    const tag = formTag.trim();
    if (!name || !tag) return;
    lookupPlayer(formRegion, name, tag);
  }

  const profile = data?.profile;
  const matches = data?.matches ?? [];

  return (
    <section className="space-y-5">
      {/* Search header */}
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Player Profile</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Search any player to view their ranked stats and match history.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]">
          <label className="space-y-1 text-sm">
            <span className="text-zinc-400">Region</span>
            <select
              value={formRegion}
              onChange={(e) => setFormRegion(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
            >
              {REGION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-zinc-400">Game Name</span>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Hide on bush"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-zinc-400">Tagline</span>
            <input
              value={formTag}
              onChange={(e) => setFormTag(e.target.value)}
              placeholder="KR1"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-fit self-end rounded-xl bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            <Search size={16} className="mr-1.5 inline-block" />
            Search
          </button>
        </form>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-zinc-400">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
          <span>Syncing live data from Riot...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Profile card */}
      {profile && !loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
              <Shield size={28} className="text-indigo-300" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-zinc-100">
                {profile.gameName}
                <span className="text-zinc-400 font-normal">#{profile.tagline}</span>
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-300">
                  {regionLabel(profile.region)}
                </span>
                <span className="font-medium text-indigo-300">
                  {profile.tier} {profile.rank}
                </span>
                <span className="text-zinc-400">— {profile.leaguePoints} LP</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-300">{profile.totalGames} games</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-300">{profile.winRate}% WR</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match history */}
      {profile && !loading && (
        <div className="space-y-2">
          <h4 className="px-1 text-sm font-medium text-zinc-400">
            Match History ({matches.length})
          </h4>

          {matches.length === 0 && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-6 text-center text-sm text-zinc-500">
              No matches found.
            </p>
          )}

          {matches.map((match) => (
            <MatchRow key={match.matchId} match={match} searchedPuuid={profile.puuid} />
          ))}
        </div>
      )}
    </section>
  );
}
