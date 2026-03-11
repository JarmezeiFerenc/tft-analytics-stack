import type { UnitStatsRow } from './types';
import { UnitStatsUnitCard } from './UnitStatsUnitCard';

interface UnitStatsTierSectionProps {
  tier: number;
  tierRows: UnitStatsRow[];
  formatUnitName: (unitId: string) => string;
}

export function UnitStatsTierSection({ tier, tierRows, formatUnitName }: UnitStatsTierSectionProps) {
  return (
    <section key={tier} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-100">{tier}-Cost Units</h3>
        <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400">
          {tierRows.length} units
        </span>
      </div>

      {tierRows.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-sm text-zinc-500">
          No units found for this tier.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {tierRows.map((row) => (
            <UnitStatsUnitCard key={row.unit_id} row={row} formatUnitName={formatUnitName} />
          ))}
        </div>
      )}
    </section>
  );
}
