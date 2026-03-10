import { PlacementChart } from '../leaderboard/PlacementChart';
import { MatchRow } from './MatchRow';
import type { MatchData } from './types';

interface MatchHistorySectionProps {
  matches: MatchData[];
  searchedPuuid: string;
}

export function MatchHistorySection({ matches, searchedPuuid }: MatchHistorySectionProps) {
  return (
    <div className="space-y-2">
      <PlacementChart matches={matches.slice(0, 20)} />

      <h4 className="px-1 text-sm font-medium text-zinc-400">Match History ({matches.length})</h4>

      {matches.length === 0 && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-6 text-center text-sm text-zinc-500">
          No matches found.
        </p>
      )}

      {matches.map((match) => (
        <MatchRow key={match.matchId} match={match} searchedPuuid={searchedPuuid} />
      ))}
    </div>
  );
}
