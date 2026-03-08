import { Loader2, Search, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Types
interface LeaderboardRow {
  gameName: string;
  tagline: string;
  region: string;
  tier: string;
  leaguePoints: number;
  totalGames: number;
  winRate: number;
}

// Constants
const API_BASE = 'http://localhost:8000/api';

const REGION_OPTIONS = [
  { label: 'Global', value: 'Global' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'NA', value: 'na1' },
  { label: 'BR', value: 'br1' },
  { label: 'KR', value: 'kr' },
];

// Helpers
function toLeaderboardRows(data: unknown): LeaderboardRow[] {
  if (Array.isArray(data)) return data as LeaderboardRow[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: LeaderboardRow[] }).data;
  }
  return [];
}

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'border-yellow-500/60 bg-yellow-500/15 text-yellow-300';
  if (rank === 2) return 'border-zinc-400/50 bg-zinc-400/10 text-zinc-300';
  if (rank === 3) return 'border-amber-600/50 bg-amber-600/10 text-amber-400';
  return 'border-zinc-700 bg-zinc-800 text-zinc-400';
}

function regionLabel(value: string): string {
  const found = REGION_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value.toUpperCase();
}

export default function Leaderboard() {
  const [region, setRegion] = useState('Global');
  const [searchValue, setSearchValue] = useState('');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (region && region !== 'Global') {
          params.set('region', region);
        }

        const query = params.toString();
        const response = await fetch(`${API_BASE}/leaderboard${query ? `?${query}` : ''}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        setRows(toLeaderboardRows(data));
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Could not load leaderboard: ${message}`);
        setRows([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [region, reloadKey]);

  const filteredRows = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    if (!needle) {
      return rows;
    }

    return rows.filter((row) => `${row.gameName}#${row.tagline}`.toLowerCase().includes(needle));
  }, [rows, searchValue]);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35">
            <Trophy size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Leaderboard</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Top 100 players by rank, filtered by region and searchable by Riot ID. 
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-2 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Region</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value || 'global'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Search Player</span>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Type Riot ID or tagline..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
            />
          </div>
        </label>

        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="h-fit self-end rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <table className="min-w-[780px] w-full text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Rank</th>
              <th className="px-4 py-3 text-left font-medium">Player</th>
              <th className="px-4 py-3 text-left font-medium">Region</th>
              <th className="px-4 py-3 text-left font-medium">Rank &amp; LP</th>
              <th className="px-4 py-3 text-left font-medium">Total Games</th>
              <th className="px-4 py-3 text-left font-medium">Top 4 Rate</th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-zinc-800/70">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={`cell-${index}-${cellIndex}`} className="px-4 py-3">
                      <div className="h-6 w-full animate-pulse rounded-md bg-zinc-800/80" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <Loader2 size={18} className="text-zinc-500" />
                    <p className="text-sm">No players found for the current filters.</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              filteredRows.map((row, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={`${row.gameName}-${row.tagline}-${row.region}-${index}`}
                    className="border-b border-zinc-800/60 transition hover:bg-zinc-800/45"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex min-w-9 items-center justify-center rounded-lg border px-2 py-1 text-xs font-semibold ${rankBadgeClass(rank)}`}
                      >
                        {rank}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">
                        {row.gameName}
                        <span className="text-zinc-400">#{row.tagline}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-zinc-300">
                        {regionLabel(row.region)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-indigo-300">{row.tier}</span>
                      <span className="text-zinc-400"> — {row.leaguePoints} LP</span>
                    </td>

                    <td className="px-4 py-3 text-zinc-200">{row.totalGames}</td>
                    <td className="px-4 py-3 text-zinc-200">{formatRate(row.winRate)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}