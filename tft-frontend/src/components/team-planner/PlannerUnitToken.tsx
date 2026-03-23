import { useDraggable } from '@dnd-kit/core';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { DragUnitPayload, PlannerUnit } from './types';

interface PlannerUnitTokenProps {
  dragId: string;
  unit: PlannerUnit;
  data: DragUnitPayload;
  label: string;
  dragDisabled?: boolean;
}

const tierRing: Record<number, string> = {
  1: 'ring-zinc-600/40 hover:ring-zinc-400/60',
  2: 'ring-emerald-600/40 hover:ring-emerald-400/60',
  3: 'ring-sky-600/40 hover:ring-sky-400/60',
  4: 'ring-fuchsia-600/40 hover:ring-fuchsia-400/60',
  5: 'ring-amber-500/50 hover:ring-amber-300/70',
};

export function PlannerUnitToken({
  dragId,
  unit,
  data,
  label,
  dragDisabled = false,
}: PlannerUnitTokenProps) {
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
      className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 transition ${
        tierRing[unit.tier] ?? tierRing[1]
      } ${
        isDragging
          ? 'opacity-40'
          : 'hover:-translate-y-0.5 hover:shadow-md'
      } bg-zinc-950`}
    >
      <TftUnitImage apiName={unit.id} className="h-full w-full object-cover" showTooltip={false} />
    </button>
  );
}
