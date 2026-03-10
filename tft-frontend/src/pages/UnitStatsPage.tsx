import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useTftAssets } from '../context/TftAssetContext';
import { TftItemIcon } from '../components/shared/TftItemIcon';
import { TftUnitImage } from '../components/shared/TftUnitImage';

interface UnitStatsApiRow {
  unit_id: string;
  average_placement: number;
  top_items: string[];
}

interface UnitStatsRow extends UnitStatsApiRow {
  cost: number;
}

const API_BASE = 'http://localhost:8000/api';
const COST_TIERS = [5, 4, 3, 2, 1] as const;

function formatUnitName(unitId: string): string {
  const firstUnderscore = unitId.indexOf('_');
  if (firstUnderscore === -1) return unitId;
  return unitId.substring(firstUnderscore + 1);
}

export default function UnitStatsPage() {
  const { ready, unitCostMap, latestSetKey } = useTftAssets();
  const [rows, setRows] = useState<UnitStatsApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/units/stats`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as UnitStatsApiRow[];
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (controller.signal.aborted) return;

        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Could not load unit stats: ${message}`);
        setRows([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => controller.abort();
  }, []);

  const grouped = useMemo(() => {
    const merged: UnitStatsRow[] = rows
      .map((row) => {
        const unitId = row.unit_id.toLowerCase();
        return {
          ...row,
          cost: unitCostMap.get(unitId) ?? -1,
        };
      })
      .filter((row) => row.cost >= 1 && row.cost <= 5);

    const byTier = new Map<number, UnitStatsRow[]>();
    for (const tier of COST_TIERS) {
      byTier.set(tier, []);
    }

    for (const row of merged) {
      byTier.get(row.cost)?.push(row);
    }

    for (const [tier, tierRows] of byTier.entries()) {
      byTier.set(
        tier,
        [...tierRows].sort((a, b) => {
          if (a.average_placement !== b.average_placement) {
            return a.average_placement - b.average_placement;
          }
          return a.unit_id.localeCompare(b.unit_id);
        }),
      );
    }

    return byTier;
  }, [rows, unitCostMap]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/35">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Unit Stats</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Average placement and most built 3-item combinations grouped by unit cost.
              {latestSetKey ? ` Latest CDragon set: ${latestSetKey}.` : ''}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading || !ready ? (
        <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-20 text-zinc-400">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading unit statistics...
        </div>
      ) : (
        <div className="space-y-5">
          {COST_TIERS.map((tier) => {
            const tierRows = grouped.get(tier) ?? [];

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
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tierRows.map((row) => (
                      <article
                        key={row.unit_id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/80"
                      >
                        <div className="flex items-center gap-3">
                          <TftUnitImage unitId={row.unit_id} className="h-12 w-12 rounded-lg border border-[#d4af37] object-cover" />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-300">{formatUnitName(row.unit_id)}</p>
                            <p className="text-sm text-zinc-400">
                              Avg Place: <strong className="text-zinc-100">{row.average_placement.toFixed(2)}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          {(row.top_items ?? []).slice(0, 3).map((itemId) => (
                            <TftItemIcon key={`${row.unit_id}-${itemId}`} itemId={itemId} className="h-9 w-9 rounded-md border border-zinc-700 object-cover" />
                          ))}
                          {(row.top_items ?? []).length === 0 && (
                            <span className="text-xs text-zinc-500">No valid 3-item build found</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
