import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { BoardSlot, DragUnitPayload, PlannerUnit } from './types';

interface HexBoardSlotProps {
  slotIndex: number;
  unit: BoardSlot;
  activeSlotIndex?: number | null;
}

function BoardUnitDraggable({ slotIndex, unit, hidden }: { slotIndex: number; unit: PlannerUnit; hidden: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `board-unit:${slotIndex}`,
    data: { source: 'board', unit, slotIndex } satisfies DragUnitPayload,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing ${hidden ? 'opacity-0' : ''}`}
    >
      <TftUnitImage apiName={unit.id} className="h-full w-full object-cover" />
    </div>
  );
}

export function HexBoardSlot({ slotIndex, unit, activeSlotIndex }: HexBoardSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `board-slot:${slotIndex}`,
    data: { type: 'board-slot', slotIndex },
  });

  const isActiveOrigin = slotIndex === activeSlotIndex;

  return (
    <div
      ref={setNodeRef}
      className={`hex-slot relative overflow-hidden hex-clip transition-colors duration-150 ${
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

      {unit && (
        <BoardUnitDraggable slotIndex={slotIndex} unit={unit} hidden={isActiveOrigin} />
      )}
    </div>
  );
}
