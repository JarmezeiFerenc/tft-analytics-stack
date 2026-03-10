import { Search } from 'lucide-react';
import type { RegionOption } from './types';

interface LeaderboardControlsProps {
  region: string;
  searchValue: string;
  regionOptions: RegionOption[];
  setRegion: (value: string) => void;
  setSearchValue: (value: string) => void;
  refresh: () => void;
}

export function LeaderboardControls({
  region,
  searchValue,
  regionOptions,
  setRegion,
  setSearchValue,
  refresh,
}: LeaderboardControlsProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-2 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
      <label className="space-y-1 text-sm">
        <span className="text-zinc-400">Region</span>
        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
        >
          {regionOptions.map((option) => (
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
        onClick={refresh}
        className="h-fit self-end rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
      >
        Refresh
      </button>
    </div>
  );
}
