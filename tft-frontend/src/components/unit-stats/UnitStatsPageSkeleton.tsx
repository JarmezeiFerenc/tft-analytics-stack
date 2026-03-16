const COST_TIERS = [5, 4, 3, 2, 1] as const;

export function UnitStatsPageSkeleton() {
  return (
    <div className="space-y-5">
      {COST_TIERS.map((tier) => (
        <section key={`skeleton-tier-${tier}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="h-5 w-32 animate-pulse rounded-full bg-zinc-700/70" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800/90" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={`unit-skeleton-${tier}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 animate-pulse rounded-md bg-zinc-700/80" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
                    <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-800/90" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: 3 }).map((__, itemIndex) => (
                    <div key={`item-skeleton-${tier}-${index}-${itemIndex}`} className="h-9 w-9 animate-pulse rounded-md bg-zinc-800/90" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
