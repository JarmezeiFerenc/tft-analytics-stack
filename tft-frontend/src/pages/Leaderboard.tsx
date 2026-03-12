import { useEffect, useMemo, useState } from 'react';
import { LeaderboardControls } from '../components/leaderboard/LeaderboardControls';
import { LeaderboardHeader } from '../components/leaderboard/LeaderboardHeader';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import type { LeaderboardRow, RegionOption } from '../components/leaderboard/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const REGION_OPTIONS: RegionOption[] = [
  { label: 'Global', value: 'Global' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'EUW', value: 'euw1' },
  { label: 'NA', value: 'na1' },
  { label: 'BR', value: 'br1' },
  { label: 'KR', value: 'kr' },
];

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

function regionLabel(value: string, regionOptions: RegionOption[]): string {
  const found = regionOptions.find((o) => o.value === value);
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
      <LeaderboardHeader />

      <LeaderboardControls
        region={region}
        searchValue={searchValue}
        regionOptions={REGION_OPTIONS}
        setRegion={setRegion}
        setSearchValue={setSearchValue}
        refresh={() => setReloadKey((value) => value + 1)}
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <LeaderboardTable
        loading={loading}
        rows={filteredRows}
        formatRate={formatRate}
        rankBadgeClass={rankBadgeClass}
        regionLabel={regionLabel}
        regionOptions={REGION_OPTIONS}
      />
    </section>
  );
}