export interface UnitStatsApiRow {
  unit_id: string;
  average_placement: number;
  top_items: string[];
}

export interface UnitStatsRow extends UnitStatsApiRow {
  cost: number;
}
