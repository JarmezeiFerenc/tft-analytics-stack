import { BOARD_SLOT_COUNT } from './types';

export function TeamPlannerPageSkeleton() {
  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-zinc-700/70" />
            <div className="h-8 w-56 animate-pulse rounded-full bg-zinc-700/80" />
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 px-3.5 py-2 text-center">
              <div className="h-2.5 w-12 animate-pulse rounded-full bg-zinc-800/90" />
              <div className="mt-2 h-4 w-10 animate-pulse rounded-full bg-zinc-700/80" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-xl bg-zinc-800/90" />
          </div>
        </div>
      </header>

      <div className="flex justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/50 py-6 sm:py-8">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: BOARD_SLOT_COUNT }).map((_, index) => (
            <div key={`planner-board-skeleton-${index}`} className="h-16 w-16 animate-pulse rounded-md bg-zinc-800/80" />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, tierIndex) => (
            <div key={`planner-tier-skeleton-${tierIndex}`}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-800/90" />
                <div className="h-3 w-8 animate-pulse rounded-full bg-zinc-700/70" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {Array.from({ length: 6 }).map((__, unitIndex) => (
                  <div key={`planner-unit-skeleton-${tierIndex}-${unitIndex}`} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-1.5">
                    <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-700/80" />
                    <div className="mt-1.5 h-3 w-24 animate-pulse rounded-full bg-zinc-800/90" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
