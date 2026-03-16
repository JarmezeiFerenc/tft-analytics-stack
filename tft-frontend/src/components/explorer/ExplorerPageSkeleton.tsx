import { ExplorerSidebarSkeleton } from './ExplorerSidebarSkeleton';
import { ExplorerTableSkeleton } from './ExplorerTableSkeleton';

export function ExplorerPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <ExplorerSidebarSkeleton />
      <main className="flex-1 space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="h-7 w-40 animate-pulse rounded-full bg-zinc-700/80" />
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="h-8 w-56 animate-pulse rounded-full bg-zinc-700/80" />
        </div>
        <ExplorerTableSkeleton />
      </main>
    </div>
  );
}
