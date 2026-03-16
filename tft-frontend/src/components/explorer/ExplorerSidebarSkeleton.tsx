export function ExplorerSidebarSkeleton() {
  return (
    <aside className="w-full shrink-0 space-y-4 lg:block lg:w-72 xl:w-80">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-5">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <section key={`explorer-sidebar-skeleton-${sectionIndex}`}>
            <div className="mb-2 h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
            <div className="h-10 w-full animate-pulse rounded-md bg-zinc-800/90" />
            <div className="mt-2 space-y-2">
              {Array.from({ length: 2 }).map((__, rowIndex) => (
                <div key={`explorer-sidebar-skeleton-row-${sectionIndex}-${rowIndex}`} className="h-8 w-full animate-pulse rounded-md bg-zinc-800/80" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
