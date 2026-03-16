import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UnitStatsHeader } from '../components/unit-stats/UnitStatsHeader';
import { UnitStatsTierSection } from '../components/unit-stats/UnitStatsTierSection';
import type { UnitStatsApiRow, UnitStatsRow } from '../components/unit-stats/types';
import { useTftMetadata } from '../context/TftAssetContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const COST_TIERS = [5, 4, 3, 2, 1] as const;

export default function UnitStatsPage() {
  const { ready, unitCostMap, latestSetKey, getChampionName } = useTftMetadata();
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
      <UnitStatsHeader latestSetKey={latestSetKey} />

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
            return <UnitStatsTierSection key={tier} tier={tier} tierRows={tierRows} formatUnitName={getChampionName} />;
          })}
        </div>
      )}
    </section>
  );
}
