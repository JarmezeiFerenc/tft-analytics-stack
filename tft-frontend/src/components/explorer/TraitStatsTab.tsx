import { TftTraitIcon } from '../shared/TftTraitIcon';
import { EmptyTab } from './EmptyTab';
import { SortHeader } from './SortHeader';
import type { TraitStatRow } from './types';
import { useSortableData } from './useSortableData';

interface TraitStatsTabProps {
  rows: TraitStatRow[];
}

export function TraitStatsTab({ rows }: TraitStatsTabProps) {
  const { sorted, sortConfig, requestSort } = useSortableData(rows, {
    key: 'games_played',
    direction: 'desc',
  });

  if (rows.length === 0) return <EmptyTab />;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[600px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Trait</th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Avg Units"
                sortKey="avg_units"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof TraitStatRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Games"
                sortKey="games_played"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof TraitStatRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Avg Place"
                sortKey="avg_placement"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof TraitStatRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Top 4%"
                sortKey="top4_rate"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof TraitStatRow)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <TftTraitIcon apiName={r.trait_name} style={r.max_style} />
                  <span className="text-zinc-200">{r.trait_name.replace(/^TFT\d+_/, '')}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-zinc-300">{r.avg_units}</td>
              <td className="px-4 py-2.5 text-zinc-300">{r.games_played}</td>
              <td className="px-4 py-2.5 font-medium text-zinc-100">{r.avg_placement}</td>
              <td className="px-4 py-2.5 text-zinc-300">{r.top4_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
