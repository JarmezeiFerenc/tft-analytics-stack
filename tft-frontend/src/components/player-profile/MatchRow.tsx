import { ChevronDown, Clock } from 'lucide-react';
import { useState } from 'react';
import { TftItemIcon as TftItemImage } from '../shared/TftItemIcon';
import { TftTraitIcon } from '../shared/TftTraitIcon';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { MatchData, TraitData, UnitData } from './types';

const RARITY_RING: Record<number, string> = {
  0: 'ring-zinc-600',
  1: 'ring-green-500',
  2: 'ring-blue-500',
  4: 'ring-purple-500',
  6: 'ring-yellow-500',
};

function placementColor(p: number): string {
  if (p === 1) return 'text-yellow-300';
  if (p <= 4) return 'text-green-400';
  return 'text-red-400';
}

function placementBg(p: number): string {
  if (p === 1) return 'border-yellow-500/60 bg-yellow-500/15';
  if (p <= 4) return 'border-green-500/40 bg-green-500/10';
  return 'border-red-500/30 bg-red-500/10';
}

function formatGameLength(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function sortTraitsForDisplay(traits: TraitData[]): TraitData[] {
  return [...traits]
    .filter((trait) => trait.style > 0)
    .sort((a, b) => {
      if (b.style !== a.style) return b.style - a.style;
      return b.numUnits - a.numUnits;
    });
}

function UnitIcon({ unit }: { unit: UnitData }) {
  const ring = RARITY_RING[unit.rarity] ?? 'ring-zinc-600';
  return (
    <div className="group relative flex flex-col items-center">
      <div className={`h-8 w-8 overflow-hidden rounded-md ring-2 ${ring}`}>
        <TftUnitImage apiName={unit.characterId} className="h-full w-full object-cover" />
      </div>
      {unit.tier > 1 && (
        <div className="mt-0.5 flex gap-px">
          {Array.from({ length: unit.tier }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-yellow-400" />
          ))}
        </div>
      )}
      {unit.items.length > 0 && (
        <div className="mt-0.5 flex gap-px">
          {unit.items.map((item, i) => (
            <TftItemImage key={i} apiName={item} className="h-3.5 w-3.5 rounded-sm object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

interface MatchRowProps {
  match: MatchData;
  searchedPuuid: string;
}

export function MatchRow({ match, searchedPuuid }: MatchRowProps) {
  const [open, setOpen] = useState(false);
  const placement = match.myPlacement ?? 0;
  const topTraits = sortTraitsForDisplay(match.myTraits);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800/50"
      >
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${placementBg(placement)} ${placementColor(placement)}`}
        >
          {placement || '?'}
        </span>

        <div className="flex flex-wrap items-start gap-1.5">
          {match.myUnits.map((u, i) => (
            <UnitIcon key={i} unit={u} />
          ))}
        </div>

        <div className="ml-auto hidden flex-wrap gap-1 sm:flex">
          {topTraits.map((trait, i) => (
            <TftTraitIcon
              key={`${trait.name}-${trait.style}-${i}`}
              apiName={trait.name}
              style={trait.style}
              numUnits={trait.numUnits}
            />
          ))}
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatGameLength(match.gameLength)}
          </span>
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950/50 px-2 py-2 sm:px-4 sm:py-3">
          <div className="space-y-1.5">
            {match.participants.map((p, i) => {
              const isMe = p.puuid === searchedPuuid;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${isMe ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : 'hover:bg-zinc-800/40'}`}
                >
                  <span className={`w-5 shrink-0 text-center font-bold ${placementColor(p.placement)}`}>
                    {p.placement}
                  </span>

                  <div className="w-32 shrink-0 truncate">
                    <span className="text-zinc-100">{p.gameName ?? 'Unknown'}</span>
                    <span className="text-zinc-500 text-xs"> #{p.tagline ?? '???'}</span>
                  </div>

                  <div className="flex flex-1 flex-wrap items-start gap-1.5">
                    {p.units.map((u, j) => (
                      <UnitIcon key={j} unit={u} />
                    ))}
                  </div>

                  <div className="hidden flex-wrap justify-end gap-1 lg:flex">
                    {sortTraitsForDisplay(p.traits).map((trait, k) => (
                      <TftTraitIcon
                        key={`${trait.name}-${trait.style}-${k}`}
                        apiName={trait.name}
                        style={trait.style}
                        numUnits={trait.numUnits}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
