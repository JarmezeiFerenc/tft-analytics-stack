export function PlayerProfileSkeleton() {
  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-md bg-zinc-700/80" />
          <div className="space-y-2">
            <div className="h-5 w-44 animate-pulse rounded-full bg-zinc-700/80" />
            <div className="h-3 w-72 animate-pulse rounded-full bg-zinc-800/90" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-700/80" />
          <div className="mt-3 h-44 w-full animate-pulse rounded-xl bg-zinc-800/90" />
        </div>

        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`match-skeleton-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-700/80" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-800/90" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
