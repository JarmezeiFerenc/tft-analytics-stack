import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { TeamPlannerBoard } from '../components/team-planner/TeamPlannerBoard';
import { TeamPlannerPool } from '../components/team-planner/TeamPlannerPool';
import { TftUnitImage } from '../components/shared/TftUnitImage';
import { BOARD_SLOT_COUNT, type BoardSlot, type DragUnitPayload, type PlannerUnit } from '../components/team-planner/types';
import { useTftAssets } from '../context/TftAssetContext';

function createEmptyBoard(): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, () => null);
}

function formatUnitName(unitId: string): string {
  return unitId.replace(/^tft\d+_/i, '').replaceAll('_', ' ');
}

export default function TeamPlannerPage() {
  const { ready, unitMap, unitCostMap } = useTftAssets();
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(() => createEmptyBoard());
  const [activeDrag, setActiveDrag] = useState<DragUnitPayload | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const placeUnitOnBoard = (unit: PlannerUnit, targetSlotIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      next[targetSlotIndex] = { ...unit, starLevel: 1 };
      return next;
    });
  };

  const moveUnitOnBoard = (fromIndex: number, toIndex: number) => {
    setBoardSlots((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      next[toIndex] = next[fromIndex];
      next[fromIndex] = null;
      return next;
    });
  };

  const removeUnitFromBoard = (slotIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const swapUnitsOnBoard = (fromIndex: number, toIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  const unitsByTier = useMemo(() => {
    const grouped = new Map<number, PlannerUnit[]>();
    for (let tier = 1; tier <= 5; tier += 1) grouped.set(tier, []);

    const units = Array.from(unitMap.keys())
      .map((id) => {
        const unitId = id.toLowerCase();
        return {
          id,
          tier: unitCostMap.get(unitId) ?? -1,
          starLevel: 1,
        };
      })
      .filter((u) => u.tier >= 1 && u.tier <= 5)
      .sort((a, b) =>
        a.tier !== b.tier
          ? a.tier - b.tier
          : formatUnitName(a.id).localeCompare(formatUnitName(b.id)),
      );

    for (const unit of units) grouped.get(unit.tier)?.push(unit);
    return grouped;
  }, [unitCostMap, unitMap]);

  const occupiedSlots = useMemo(() => boardSlots.filter(Boolean).length, [boardSlots]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragUnitPayload | null) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const payload = event.active.data.current as DragUnitPayload | null;
    const overId = event.over?.id;

    setActiveDrag(null);

    if (!payload) return;

    if (typeof overId !== 'string') {
      if (payload.source === 'board' && payload.slotIndex !== undefined) {
        removeUnitFromBoard(payload.slotIndex);
      }
      return;
    }

    if (overId === 'unit-pool') {
      if (payload.source === 'board' && payload.slotIndex !== undefined) {
        removeUnitFromBoard(payload.slotIndex);
      }
      return;
    }

    if (!overId.startsWith('board-slot:')) return;

    const targetIndex = Number(overId.split(':')[1]);
    if (Number.isNaN(targetIndex)) return;

    const targetUnit = boardSlots[targetIndex];

    if (payload.source === 'pool') {
      placeUnitOnBoard(payload.unit, targetIndex);
      return;
    }

    if (payload.slotIndex === undefined || payload.slotIndex === targetIndex) return;

    if (targetUnit === null) {
      moveUnitOnBoard(payload.slotIndex, targetIndex);
    } else {
      swapUnitsOnBoard(payload.slotIndex, targetIndex);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-20 text-zinc-400">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Preparing planner assets…
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <section className="space-y-6">
        <header className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Prototype</p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                TFT Team Planner
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 px-3.5 py-2 text-center">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500">Board</div>
                <div className="text-base font-semibold text-zinc-100">
                  {occupiedSlots}<span className="text-zinc-500">/{BOARD_SLOT_COUNT}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBoardSlots(createEmptyBoard())}
                className="flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-200 transition hover:bg-red-500/15"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </div>
          </div>
        </header>

        <TeamPlannerBoard
          boardSlots={boardSlots}
          activeSlotIndex={activeDrag?.source === 'board' ? activeDrag.slotIndex ?? null : null}
        />

        <TeamPlannerPool unitsByTier={unitsByTier} />

        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className="hex-clip hex-slot pointer-events-none opacity-90">
              <TftUnitImage apiName={activeDrag.unit.id} className="h-full w-full object-cover" />
            </div>
          ) : null}
        </DragOverlay>
      </section>
    </DndContext>
  );
}