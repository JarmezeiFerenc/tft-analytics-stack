export function LeaderboardTableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-b border-zinc-800/70">
          <td className="px-4 py-3">
            <div className="h-6 w-10 animate-pulse rounded-full bg-zinc-700/80" />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-md bg-zinc-700/80" />
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-800/90" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800/90" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-700/80" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-14 animate-pulse rounded-full bg-zinc-700/80" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-14 animate-pulse rounded-full bg-zinc-700/80" />
          </td>
        </tr>
      ))}
    </>
  );
}
