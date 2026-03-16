export function ExplorerTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[600px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80">
          <tr>
            {Array.from({ length: 5 }).map((_, index) => (
              <th key={`explorer-th-skeleton-${index}`} className="px-4 py-2.5 text-left">
                <div className="h-3 w-20 animate-pulse rounded-full bg-zinc-700/80" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <tr key={`explorer-row-skeleton-${rowIndex}`} className="border-b border-zinc-800/50 last:border-b-0">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-700/80" />
                  <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-800/90" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
                </div>
              </td>
              {Array.from({ length: 4 }).map((__, cellIndex) => (
                <td key={`explorer-cell-skeleton-${rowIndex}-${cellIndex}`} className="px-4 py-2.5">
                  <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-700/80" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
