import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftHoverTooltip } from '../shared/TftHoverTooltip';
import type { BoardSlot } from './types';
import { useTraitTracker, type TraitStatus } from './useTraitTracker';

/* ── tier style helpers ── */

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

/* ── trait list sub-components ── */

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

/* ── shared trait list content ── */

function TraitTrackerContent({ traits }: { traits: TraitStatus[] }) {
  return (
    <>
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
    </>
  );
}

/* ── mobile drawer ── */

function MobileTraitDrawer({ traits }: { traits: TraitStatus[] }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const activeCount = traits.filter((t) => t.activeStyle > 0).length;

  return (
    <>
      {/* floating button — visible only <lg */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-xl shadow-black/40 backdrop-blur transition hover:bg-zinc-800 lg:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-cyan-400">
          <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
        </svg>
        Traits
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300">
            {activeCount}
          </span>
        )}
      </button>

      {/* drawer portal */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={close}
              onKeyDown={(e) => e.key === 'Escape' && close()}
            />

            {/* panel */}
            <aside className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-zinc-900 shadow-2xl shadow-black/60 animate-[slideInRight_200ms_ease-out]">
              {/* close bar */}
              <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                  Synergies
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>

              {/* scrollable trait list */}
              <div className="flex-1 overflow-y-auto px-1.5 py-2">
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
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ── public exports ── */

interface TraitTrackerSidebarProps {
  boardSlots: BoardSlot[];
}

/** Desktop sidebar — hidden below lg */
export function TraitTrackerSidebar({ boardSlots }: TraitTrackerSidebarProps) {
  const { unitMap, traitMap } = useTftAssets();
  const traits = useTraitTracker(boardSlots, unitMap, traitMap);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-4 rounded-2xl border border-zinc-800 bg-zinc-900/80">
        <TraitTrackerContent traits={traits} />
      </div>
    </aside>
  );
}

/** Mobile/Tablet floating button + drawer — hidden at lg+ */
export function MobileTraitButton({ boardSlots }: TraitTrackerSidebarProps) {
  const { unitMap, traitMap } = useTftAssets();
  const traits = useTraitTracker(boardSlots, unitMap, traitMap);

  return <MobileTraitDrawer traits={traits} />;
}
