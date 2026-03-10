import { Shield } from 'lucide-react';
import type { ProfileData } from './types';

interface PlayerProfileCardProps {
  profile: ProfileData;
  regionLabel: (value: string) => string;
}

export function PlayerProfileCard({ profile, regionLabel }: PlayerProfileCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
          <Shield size={28} className="text-indigo-300" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-zinc-100">
            {profile.gameName}
            <span className="text-zinc-400 font-normal">#{profile.tagline}</span>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-300">
              {regionLabel(profile.region)}
            </span>
            <span className="font-medium text-indigo-300">
              {profile.tier} {profile.rank}
            </span>
            <span className="text-zinc-400">- {profile.leaguePoints} LP</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">{profile.totalGames} games</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">{profile.winRate}% WR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
