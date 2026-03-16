import { useDroppable } from '@dnd-kit/core';
import { useTftAssets } from '../../context/TftAssetContext';
import { PlannerUnitToken } from './PlannerUnitToken';
import type { PlannerUnit } from './types';

interface TeamPlannerPoolProps {
  unitsByTier: Map<number, PlannerUnit[]>;
}

const COST_TIERS = [1, 2, 3, 4, 5] as const;

const tierLabel: Record<number, string> = {
  1: 'text-zinc-300 border-zinc-600/50 bg-zinc-800/50',
  2: 'text-emerald-300 border-emerald-600/30 bg-emerald-900/20',
  3: 'text-sky-300 border-sky-600/30 bg-sky-900/20',
  4: 'text-fuchsia-300 border-fuchsia-600/30 bg-fuchsia-900/20',
  5: 'text-amber-300 border-amber-500/30 bg-amber-900/20',
};

export function TeamPlannerPool({ unitsByTier }: TeamPlannerPoolProps) {
  const { getChampionData } = useTftAssets();

  const { isOver, setNodeRef } = useDroppable({
    id: 'unit-pool',
    data: { type: 'pool' },
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border bg-zinc-900/70 p-4 transition sm:p-5 ${
        isOver ? 'border-red-400/50' : 'border-zinc-800'
      }`}
    >
      <div className="space-y-4">
        {COST_TIERS.map((tier) => {
          const units = unitsByTier.get(tier) ?? [];
          if (units.length === 0) return null;

          return (
            <div key={`tier-${tier}`}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tierLabel[tier]}`}
                >
                  {tier}-Cost
                </span>
                <span className="text-[10px] text-zinc-500">{units.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {units.map((unit) => (
                  <PlannerUnitToken
                    key={`pool-${unit.id}`}
                    dragId={`pool-unit:${unit.id}`}
                    unit={unit}
                    data={{ source: 'pool', unit }}
                    label={`Add ${getChampionData(unit.id).name} to board`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
