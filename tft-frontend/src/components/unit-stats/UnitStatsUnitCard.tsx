import { TftItemIcon } from '../shared/TftItemIcon';
import { TftUnitImage } from '../shared/TftUnitImage';
import type { UnitStatsRow } from './types';

interface UnitStatsUnitCardProps {
  row: UnitStatsRow;
  formatUnitName: (unitId: string) => string;
}

export function UnitStatsUnitCard({ row, formatUnitName }: UnitStatsUnitCardProps) {
  return (
    <article
      key={row.unit_id}
      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <div className="flex items-center gap-3">
        <TftUnitImage
          unitId={row.unit_id}
          className="h-12 w-12 rounded-lg border border-[#d4af37] object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-300">{formatUnitName(row.unit_id)}</p>
          <p className="text-sm text-zinc-400">
            Avg Place: <strong className="text-zinc-100">{row.average_placement.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {(row.top_items ?? []).slice(0, 3).map((itemId) => (
          <TftItemIcon
            key={`${row.unit_id}-${itemId}`}
            itemId={itemId}
            className="h-9 w-9 rounded-md border border-zinc-700 object-cover"
          />
        ))}
        {(row.top_items ?? []).length === 0 && (
          <span className="text-xs text-zinc-500">No valid 3-item build found</span>
        )}
      </div>
    </article>
  );
}
