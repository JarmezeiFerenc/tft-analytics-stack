import { useDraggable } from '@dnd-kit/core';
import { useTftAssets } from '../../context/TftAssetContext';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { DragUnitPayload, PlannerUnit } from './types';

interface PlannerUnitTokenProps {
  dragId: string;
  unit: PlannerUnit;
  data: DragUnitPayload;
  label: string;
  dragDisabled?: boolean;
}

const tierBorder: Record<number, string> = {
  1: 'border-zinc-500/40 hover:border-zinc-400/60',
  2: 'border-emerald-500/40 hover:border-emerald-400/60',
  3: 'border-sky-500/40 hover:border-sky-400/60',
  4: 'border-fuchsia-500/40 hover:border-fuchsia-400/60',
  5: 'border-amber-400/50 hover:border-amber-300/70',
};

export function PlannerUnitToken({
  dragId,
  unit,
  data,
  label,
  dragDisabled = false,
}: PlannerUnitTokenProps) {
  const { getChampionData } = useTftAssets();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data,
    disabled: dragDisabled,
  });

  const style = transform
    ? data.source === 'pool'
      ? undefined
      : { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...(dragDisabled ? {} : listeners)}
      {...(dragDisabled ? {} : attributes)}
      aria-label={label}
      className={`group flex w-full items-center gap-2.5 rounded-xl border bg-zinc-900/80 px-2.5 py-2 text-left transition-all ${
        tierBorder[unit.tier] ?? tierBorder[1]
      } ${
        isDragging
          ? 'opacity-50'
          : 'hover:-translate-y-0.5 hover:shadow-md hover:bg-zinc-800/90'
      }`}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
        <TftUnitImage apiName={unit.id} className="h-full w-full object-cover" showTooltip={false} />
      </div>
      <span className="min-w-0 truncate text-xs font-medium text-zinc-200">
        {getChampionData(unit.id).name}
      </span>
    </button>
  );
}
