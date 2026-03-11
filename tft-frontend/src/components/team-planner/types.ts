export interface PlannerUnit {
  id: string;
  tier: number;
  starLevel: number;
}

export type BoardSlot = PlannerUnit | null;

export interface DragUnitPayload {
  source: 'pool' | 'board';
  unit: PlannerUnit;
  slotIndex?: number;
}

export const BOARD_ROWS = 4;
export const BOARD_COLUMNS = 7;
export const BOARD_SLOT_COUNT = BOARD_ROWS * BOARD_COLUMNS;
