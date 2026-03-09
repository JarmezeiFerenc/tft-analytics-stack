import { BarChart3, Search, ShieldCheck, Swords, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const REGION_OPTIONS = [
  { label: 'EUW', value: 'euw1' },
  { label: 'EUNE', value: 'eun1' },
  { label: 'NA', value: 'na1' },
  { label: 'KR', value: 'kr' },
  { label: 'BR', value: 'br1' },
];

function parseRiotId(input: string): { gameName: string; tagline: string } | null {
  const [name, tag] = input.split('#');
  const gameName = name?.trim();
  const tagline = tag?.trim();
  if (!gameName || !tagline) return null;
  return { gameName, tagline };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('euw1');
  const [riotId, setRiotId] = useState('');

  const parsed = useMemo(() => parseRiotId(riotId), [riotId]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return;
    navigate(`/player/${region}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagline)}`);
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 sm:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
            Raw Match Analysis &amp; Custom Statistics
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-zinc-400 sm:text-base">
            Direct Riot API sync + local SQL analytics for players who want reproducible, inspectable TFT performance data.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-7 grid max-w-3xl gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-[150px_1fr_auto]">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-indigo-500/60 transition focus:ring"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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

          {!parsed && riotId.length > 0 && (
            <p className="mt-2 text-xs text-red-300">Use format: `GameName#Tagline`</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-zinc-300" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Under the Hood</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <Swords size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-100">Data Source</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Direct Riot API integration with local MySQL caching for lightning-fast history browsing.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <BarChart3 size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-100">Analytics</h3>
            <p className="mt-2 text-sm text-zinc-400">
              SQL-Powered Filter Engine for Unit &amp; Item Synergies and custom BiS aggregation from stored matches.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
              <TrendingUp size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-100">Asset Management</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Built-in CDragon Asset Resolver with dynamic .tex to .png mapping using latest community-maintained assets.
            </p>
          </article>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
        <p className="text-sm text-zinc-400">
          Open source project focused on TFT data integrity and deep-dive analytics.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          GitHub
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">OSS</span>
        </a>
      </div>
    </section>
  );
}
