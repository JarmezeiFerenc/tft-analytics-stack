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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { TeamPlannerBoard } from '../components/team-planner/TeamPlannerBoard';
import { TeamPlannerPageSkeleton } from '../components/team-planner/TeamPlannerPageSkeleton';
import { TeamPlannerPool } from '../components/team-planner/TeamPlannerPool';
import { ItemPool } from '../components/team-planner/ItemPool';
import { TraitTrackerSidebar } from '../components/team-planner/TraitTrackerSidebar';
import { TftUnitImage } from '../components/shared/TftUnitImage';
import {
  BOARD_SLOT_COUNT,
  MAX_ITEMS_PER_UNIT,
  type BoardSlot,
  type DragItemPayload,
  type DragPayload,
  type DragUnitPayload,
  type PlannerUnit,
} from '../components/team-planner/types';
import { useTftAssets } from '../context/TftAssetContext';

/* ── board helpers ── */

function createEmptyBoard(): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, () => null);
}

function serializeBoardToQuery(boardSlots: BoardSlot[]): string {
  return boardSlots
    .flatMap((slot, index) => (slot ? [`${index}:${slot.id}`] : []))
    .join(',');
}

function parseBoardFromQuery(search: string): BoardSlot[] {
  const boardSlots = createEmptyBoard();
  const boardParam = new URLSearchParams(search).get('board');

  if (!boardParam) {
    return boardSlots;
  }

  for (const pair of boardParam.split(',')) {
    const [rawIndex, rawApiName] = pair.split(':');
    const index = Number(rawIndex);
    const apiName = rawApiName?.trim();

    if (!Number.isInteger(index) || index < 0 || index >= BOARD_SLOT_COUNT || !apiName) {
      continue;
    }

    boardSlots[index] = {
      id: apiName,
      tier: -1,
      starLevel: 1,
      items: [],
    };
  }

  return boardSlots;
}

function isUnitPayload(p: DragPayload): p is DragUnitPayload {
  return p.source === 'pool' || p.source === 'board';
}

function isItemPayload(p: DragPayload): p is DragItemPayload {
  return p.source === 'item';
}

/* ── page component ── */

export default function TeamPlannerPage() {
  const { ready, unitMap } = useTftAssets();
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(() => {
    if (typeof window === 'undefined') {
      return createEmptyBoard();
    }

    return parseBoardFromQuery(window.location.search);
  });
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* ── board mutations ── */

  const placeUnitOnBoard = useCallback((unit: PlannerUnit, targetSlotIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      next[targetSlotIndex] = { ...unit, starLevel: 1, items: [] };
      return next;
    });
  }, []);

  const moveUnitOnBoard = useCallback((fromIndex: number, toIndex: number) => {
    setBoardSlots((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      next[toIndex] = next[fromIndex];
      next[fromIndex] = null;
      return next;
    });
  }, []);

  const removeUnitFromBoard = useCallback((slotIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  const swapUnitsOnBoard = useCallback((fromIndex: number, toIndex: number) => {
    setBoardSlots((prev) => {
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  }, []);

  const cycleStarLevel = useCallback((slotIndex: number) => {
    setBoardSlots((prev) => {
      const unit = prev[slotIndex];
      if (!unit) return prev;
      const next = [...prev];
      const nextStar = ((unit.starLevel % 3) + 1) as 1 | 2 | 3;
      next[slotIndex] = { ...unit, starLevel: nextStar };
      return next;
    });
  }, []);

  const addItemToUnit = useCallback((slotIndex: number, itemApiName: string) => {
    setBoardSlots((prev) => {
      const unit = prev[slotIndex];
      if (!unit) return prev;
      if (unit.items.length >= MAX_ITEMS_PER_UNIT) return prev;
      const next = [...prev];
      next[slotIndex] = { ...unit, items: [...unit.items, itemApiName] };
      return next;
    });
  }, []);

  /* ── derived state ── */

  const unitsByTier = useMemo(() => {
    const grouped = new Map<number, PlannerUnit[]>();
    for (let tier = 1; tier <= 5; tier += 1) grouped.set(tier, []);

    const units = Array.from(unitMap.values())
      .map((unit) => ({
        id: unit.apiName,
        tier: unit.cost ?? -1,
        name: unit.name,
        starLevel: 1 as const,
        items: [] as string[],
      }))
      .filter((u) => u.tier >= 1 && u.tier <= 5)
      .sort((a, b) =>
        a.tier !== b.tier
          ? a.tier - b.tier
          : a.name.localeCompare(b.name),
      );

    for (const unit of units) {
      grouped.get(unit.tier)?.push({
        id: unit.id,
        tier: unit.tier,
        starLevel: unit.starLevel,
        items: unit.items,
      });
    }
    return grouped;
  }, [unitMap]);

  const occupiedSlots = useMemo(() => boardSlots.filter(Boolean).length, [boardSlots]);

  /* ── URL sync ── */

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const serializedBoard = serializeBoardToQuery(boardSlots);

    if (serializedBoard) {
      params.set('board', serializedBoard);
    } else {
      params.delete('board');
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, [boardSlots]);

  /* ── drag handlers ── */

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragPayload | null) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const payload = event.active.data.current as DragPayload | null;
    const overId = event.over?.id;

    setActiveDrag(null);

    if (!payload) return;

    // ── item drag ──
    if (isItemPayload(payload)) {
      if (typeof overId !== 'string' || !overId.startsWith('board-slot:')) return;
      const targetIndex = Number(overId.split(':')[1]);
      if (Number.isNaN(targetIndex) || !boardSlots[targetIndex]) return;
      addItemToUnit(targetIndex, payload.itemApiName);
      return;
    }

    // ── unit drag ──
    if (!isUnitPayload(payload)) return;

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

  /* ── render ── */

  if (!ready) {
    return <TeamPlannerPageSkeleton />;
  }

  const activeUnitDrag = activeDrag && isUnitPayload(activeDrag) ? activeDrag : null;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
      <TraitTrackerSidebar boardSlots={boardSlots} />
      <section className="min-w-0 flex-1 space-y-6">
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
          activeSlotIndex={activeUnitDrag?.slotIndex ?? null}
          onStarCycle={cycleStarLevel}
        />

        {/* side-by-side pools */}
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <TeamPlannerPool unitsByTier={unitsByTier} />
          </div>
          <div className="min-w-0 flex-1">
            <ItemPool />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeUnitDrag ? (
            <div className="hex-clip hex-slot pointer-events-none opacity-90">
              <TftUnitImage apiName={activeUnitDrag.unit.id} className="h-full w-full object-cover" showTooltip={false} />
            </div>
          ) : null}
        </DragOverlay>
      </section>
      </div>
    </DndContext>
  );
}