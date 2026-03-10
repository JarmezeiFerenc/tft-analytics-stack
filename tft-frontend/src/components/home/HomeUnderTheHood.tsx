import { BarChart3, ShieldCheck, Swords, TrendingUp } from 'lucide-react';

export function HomeUnderTheHood() {
  return (
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
  );
}
