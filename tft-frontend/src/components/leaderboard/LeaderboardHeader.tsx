import { Trophy } from 'lucide-react';

export function LeaderboardHeader() {
  return (
    <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35">
          <Trophy size={20} />
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Leaderboard</h2>
          <p className="mt-1 text-sm text-zinc-400">Top 100 players by rank, filtered by region and searchable by Riot ID.</p>
        </div>
      </div>
    </header>
  );
}
