export interface UnitFilter {
  id: string;
  items: string[];
  itemCount: number | null;
}

export type TabId = 'items' | 'traits' | 'single_items';

export interface ItemComboRow {
  unit_id: string;
  item_1: string | null;
  item_2: string | null;
  item_3: string | null;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

export interface TraitStatRow {
  trait_name: string;
  max_style: number;
  avg_units: number;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

export interface SingleItemRow {
  unit_id: string;
  item_name: string;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

export interface SummaryData {
  total_games: number;
  avg_placement: number;
  top4_rate: number;
  win_rate: number;
  avg_level: number;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}
