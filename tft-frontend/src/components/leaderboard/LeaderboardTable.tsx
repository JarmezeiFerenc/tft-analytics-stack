import { Loader2 } from 'lucide-react';
import { LeaderboardTableSkeleton } from './LeaderboardTableSkeleton';
import type { LeaderboardRow, RegionOption } from './types';

interface LeaderboardTableProps {
  loading: boolean;
  rows: LeaderboardRow[];
  formatRate: (value: number) => string;
  rankBadgeClass: (rank: number) => string;
  regionLabel: (value: string, regionOptions: RegionOption[]) => string;
  regionOptions: RegionOption[];
}

export function LeaderboardTable({
  loading,
  rows,
  formatRate,
  rankBadgeClass,
  regionLabel,
  regionOptions,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[780px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Rank</th>
            <th className="px-4 py-3 text-left font-medium">Player</th>
            <th className="px-4 py-3 text-left font-medium">Region</th>
            <th className="px-4 py-3 text-left font-medium">Rank &amp; LP</th>
            <th className="px-4 py-3 text-left font-medium">Total Games</th>
            <th className="px-4 py-3 text-left font-medium">Top 4 Rate</th>
          </tr>
        </thead>

        <tbody>
          {loading && <LeaderboardTableSkeleton />}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                  <Loader2 size={18} className="text-zinc-500" />
                  <p className="text-sm">No players found for the current filters.</p>
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row, index) => {
              const rank = index + 1;
              return (
                <tr
                  key={`${row.gameName}-${row.tagline}-${row.region}-${index}`}
                  className="border-b border-zinc-800/60 transition hover:bg-zinc-800/45"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex min-w-9 items-center justify-center rounded-lg border px-2 py-1 text-xs font-semibold ${rankBadgeClass(rank)}`}
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100">
                      {row.gameName}
                      <span className="text-zinc-400">#{row.tagline}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-zinc-300">
                      {regionLabel(row.region, regionOptions)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-medium text-indigo-300">{row.tier}</span>
                    <span className="text-zinc-400"> - {row.leaguePoints} LP</span>
                  </td>

                  <td className="px-4 py-3 text-zinc-200">{row.totalGames}</td>
                  <td className="px-4 py-3 text-zinc-200">{formatRate(row.winRate)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
