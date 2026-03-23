export interface PlannerUnit {
  id: string;
  tier: number;
  starLevel: 1 | 2 | 3;
  items: string[];
}

export type BoardSlot = PlannerUnit | null;

export interface DragUnitPayload {
  source: 'pool' | 'board';
  unit: PlannerUnit;
  slotIndex?: number;
}

export interface DragItemPayload {
  source: 'item';
  itemApiName: string;
}

export type DragPayload = DragUnitPayload | DragItemPayload;

export const BOARD_ROWS = 4;
export const BOARD_COLUMNS = 7;
export const BOARD_SLOT_COUNT = BOARD_ROWS * BOARD_COLUMNS;

export const MAX_ITEMS_PER_UNIT = 3;
