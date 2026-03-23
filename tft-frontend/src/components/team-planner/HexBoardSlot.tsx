import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { BoardSlot, DragUnitPayload, PlannerUnit } from './types';

const STAR_COLOR: Record<number, string> = {
  1: 'text-zinc-400',
  2: 'text-sky-300',
  3: 'text-amber-300',
};

function StarDisplay({ starLevel }: { starLevel: 1 | 2 | 3 }) {
  const color = STAR_COLOR[starLevel] ?? STAR_COLOR[1];
  return (
    <div
      className={`pointer-events-none absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 justify-center gap-px ${color}`}
    >
      {Array.from({ length: starLevel }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ItemIcons({ items }: { items: string[] }) {
  const { getItemData } = useTftAssets();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute -bottom-2 left-1/2 z-20 flex -translate-x-1/2 justify-center -space-x-1">
      {items.map((apiName, i) => {
        const item = getItemData(apiName);
        const src = item.icon || PLACEHOLDER_URL;
        return (
          <img
            key={`${apiName}-${i}`}
            src={src}
            alt={item.name}
            className="h-5 w-5 rounded-sm border border-zinc-900 bg-zinc-900/90 object-contain drop-shadow-md"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== PLACEHOLDER_URL) img.src = PLACEHOLDER_URL;
            }}
          />
        );
      })}
    </div>
  );
}

interface BoardUnitDraggableProps {
  slotIndex: number;
  unit: PlannerUnit;
  hidden: boolean;
  onStarCycle: (slotIndex: number) => void;
}

function BoardUnitDraggable({ slotIndex, unit, hidden, onStarCycle }: BoardUnitDraggableProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `board-unit:${slotIndex}`,
    data: { source: 'board', unit, slotIndex } satisfies DragUnitPayload,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStarCycle(slotIndex);
      }}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing ${hidden ? 'opacity-0' : ''}`}
    >
      <div className="hex-clip h-full w-full overflow-hidden">
        <TftUnitImage apiName={unit.id} className="h-full w-full object-cover" showTooltip={false} />
      </div>

      <StarDisplay starLevel={unit.starLevel} />
      <ItemIcons items={unit.items} />
    </div>
  );
}

interface HexBoardSlotProps {
  slotIndex: number;
  unit: BoardSlot;
  activeSlotIndex?: number | null;
  onStarCycle: (slotIndex: number) => void;
}

export function HexBoardSlot({ slotIndex, unit, activeSlotIndex, onStarCycle }: HexBoardSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `board-slot:${slotIndex}`,
    data: { type: 'board-slot', slotIndex },
  });

  const isActiveOrigin = slotIndex === activeSlotIndex;

  return (
    <div
      ref={setNodeRef}
      className="hex-slot relative"
    >
      <div
        className={`hex-clip absolute inset-0 transition-colors duration-150 ${
          isOver
            ? 'bg-cyan-400/20'
            : unit
              ? 'bg-zinc-800'
              : 'bg-zinc-900/70'
        }`}
      >
        {!unit && !isOver && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
        )}

        {isOver && (
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/10 to-transparent" />
        )}
      </div>

      {unit && (
        <BoardUnitDraggable
          slotIndex={slotIndex}
          unit={unit}
          hidden={isActiveOrigin}
          onStarCycle={onStarCycle}
        />
      )}
    </div>
  );
}
