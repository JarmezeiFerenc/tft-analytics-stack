import { Search, User } from 'lucide-react';
import type { RegionOption } from './types';

interface PlayerProfileSearchHeaderProps {
  formRegion: string;
  formName: string;
  formTag: string;
  loading: boolean;
  regionOptions: RegionOption[];
  setFormRegion: (value: string) => void;
  setFormName: (value: string) => void;
  setFormTag: (value: string) => void;
  handleSubmit: (event: React.FormEvent) => void;
}

export function PlayerProfileSearchHeader({
  formRegion,
  formName,
  formTag,
  loading,
  regionOptions,
  setFormRegion,
  setFormName,
  setFormTag,
  handleSubmit,
}: PlayerProfileSearchHeaderProps) {
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35">
          <User size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Player Profile</h2>
          <p className="mt-1 text-sm text-zinc-400">Search any player to view their ranked stats and match history.</p>
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
            {regionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Game Name</span>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Dishsoap"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Tagline</span>
          <input
            value={formTag}
            onChange={(e) => setFormTag(e.target.value)}
            placeholder="NA1"
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
  );
}
