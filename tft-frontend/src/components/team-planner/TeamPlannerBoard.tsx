import { HexBoardSlot } from './HexBoardSlot';
import type { BoardSlot } from './types';

interface TeamPlannerBoardProps {
  boardSlots: BoardSlot[];
  activeSlotIndex?: number | null;
}

export function TeamPlannerBoard({ boardSlots, activeSlotIndex }: TeamPlannerBoardProps) {
  return (
    <div className="flex justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/50 py-6 sm:py-8">
      <div className="hex-grid">
        {Array.from({ length: 4 }).map((_, rowIndex) => {
          const rowStart = rowIndex * 7;
          const rowSlots = boardSlots.slice(rowStart, rowStart + 7);

          return (
            <div
              key={`row-${rowIndex}`}
              className={`hex-row ${rowIndex % 2 === 1 ? 'hex-row-offset' : ''}`}
            >
              {rowSlots.map((unit, colIndex) => (
                <HexBoardSlot
                  key={`slot-${rowStart + colIndex}`}
                  slotIndex={rowStart + colIndex}
                  unit={unit}
                  activeSlotIndex={activeSlotIndex}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
