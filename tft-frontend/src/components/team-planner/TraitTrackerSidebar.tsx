import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftHoverTooltip } from '../shared/TftHoverTooltip';
import type { BoardSlot } from './types';
import { useTraitTracker, type TraitStatus } from './useTraitTracker';

const TIER_BG: Record<number, string> = {
  0: 'bg-zinc-800/60',
  1: 'bg-amber-900/80',
  2: 'bg-slate-400/80',
  3: 'bg-yellow-500/90',
};

function tierBg(style: number): string {
  if (style >= 4) return 'bg-gradient-to-br from-purple-500 to-indigo-500';
  return TIER_BG[style] ?? TIER_BG[0];
}

const TIER_RING: Record<number, string> = {
  0: 'ring-zinc-700/60',
  1: 'ring-amber-700/50',
  2: 'ring-slate-400/50',
  3: 'ring-yellow-500/50',
};

function tierRing(style: number): string {
  if (style >= 4) return 'ring-purple-400/50';
  return TIER_RING[style] ?? TIER_RING[0];
}

const TIER_TEXT: Record<number, string> = {
  0: 'text-zinc-500',
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-yellow-300',
};

function tierText(style: number): string {
  if (style >= 4) return 'text-purple-300';
  return TIER_TEXT[style] ?? TIER_TEXT[0];
}

function ThresholdPills({ trait }: { trait: TraitStatus }) {
  return (
    <div className="flex items-center gap-1">
      {trait.effects.map((effect, i) => {
        const isActive = trait.count >= effect.minUnits;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[9px] text-zinc-600">›</span>}
            <span
              className={`rounded px-1 py-px text-[10px] font-semibold leading-tight ${
                isActive
                  ? 'bg-zinc-100/10 text-zinc-100'
                  : 'text-zinc-600'
              }`}
            >
              {effect.minUnits}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function TraitRow({ trait }: { trait: TraitStatus }) {
  const isActive = trait.activeStyle > 0;
  const bg = tierBg(trait.activeStyle);
  const ring = tierRing(trait.activeStyle);
  const countColor = isActive ? tierText(trait.activeStyle) : 'text-zinc-600';

  return (
    <TftHoverTooltip title={trait.name} description={trait.desc}>
      <div
        className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition ${
          isActive ? 'bg-zinc-800/40' : 'opacity-50'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${bg} ${ring}`}
        >
          <img
            src={trait.icon || PLACEHOLDER_URL}
            alt={trait.name}
            className="h-5 w-5 object-contain"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== PLACEHOLDER_URL) img.src = PLACEHOLDER_URL;
            }}
          />
        </div>

        <span className={`w-5 text-center text-sm font-bold tabular-nums ${countColor}`}>
          {trait.count}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-zinc-200">{trait.name}</span>
          <ThresholdPills trait={trait} />
        </div>
      </div>
    </TftHoverTooltip>
  );
}

interface TraitTrackerSidebarProps {
  boardSlots: BoardSlot[];
}

export function TraitTrackerSidebar({ boardSlots }: TraitTrackerSidebarProps) {
  const { unitMap, traitMap } = useTftAssets();
  const traits = useTraitTracker(boardSlots, unitMap, traitMap);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-4 rounded-2xl border border-zinc-800 bg-zinc-900/80">
        <div className="border-b border-zinc-800/60 px-4 py-3">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">
            Synergies
          </h2>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-1.5 py-2">
          {traits.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-600">
              Place units on the board
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {traits.map((t) => (
                <TraitRow key={t.traitApiName} trait={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
