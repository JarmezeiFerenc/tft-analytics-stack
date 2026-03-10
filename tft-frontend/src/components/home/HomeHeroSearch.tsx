import { Search } from 'lucide-react';

interface HomeHeroSearchProps {
  regionOptions: Array<{ label: string; value: string }>;
  region: string;
  riotId: string;
  parsed: { gameName: string; tagline: string } | null;
  setRegion: (value: string) => void;
  setRiotId: (value: string) => void;
  handleSearch: (event: React.FormEvent) => void;
}

export function HomeHeroSearch({
  regionOptions,
  region,
  riotId,
  parsed,
  setRegion,
  setRiotId,
  handleSearch,
}: HomeHeroSearchProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 sm:p-10">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
          Raw Match Analysis &amp; Custom Statistics
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-zinc-400 sm:text-base">
          Direct Riot API sync + local SQL analytics for players who want reproducible, inspectable TFT performance
          data.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-7 grid max-w-3xl gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-[150px_1fr_auto]"
        >
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-indigo-500/60 transition focus:ring"
          >
            {regionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Summoner#TAG"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-indigo-500/60 transition focus:ring"
          />

          <button
            type="submit"
            disabled={!parsed}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={15} />
            Search
          </button>
        </form>

        {!parsed && riotId.length > 0 && <p className="mt-2 text-xs text-red-300">Use format: `GameName#Tagline`</p>}
      </div>
    </div>
  );
}
