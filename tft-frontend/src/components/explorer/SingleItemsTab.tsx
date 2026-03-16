import { TftItemIcon as TftItemImage } from '../shared/TftItemIcon';
import { TftUnitImage } from '../shared/TftUnitImage';
import { EmptyTab } from './EmptyTab';
import { SortHeader } from './SortHeader';
import type { SingleItemRow } from './types';
import { useSortableData } from './useSortableData';
import { useTftMetadata } from '../../context/TftAssetContext';

interface SingleItemsTabProps {
  rows: SingleItemRow[];
}

export function SingleItemsTab({ rows }: SingleItemsTabProps) {
  const { getItemName } = useTftMetadata();

  const { sorted, sortConfig, requestSort } = useSortableData(rows, {
    key: 'games_played',
    direction: 'desc',
  });

  if (rows.length === 0) return <EmptyTab />;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[500px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Item</th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Games"
                sortKey="games_played"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof SingleItemRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Avg Place"
                sortKey="avg_placement"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof SingleItemRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Top 4%"
                sortKey="top4_rate"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof SingleItemRow)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {r.unit_id && (
                    <TftUnitImage
                      apiName={r.unit_id}
                      className="h-8 w-8 rounded-lg border border-[#d4af37] object-cover"
                    />
                  )}
                  <TftItemImage
                    apiName={r.item_name}
                    className="h-8 w-8 rounded-md border border-zinc-600 object-cover"
                  />
                  <span className="text-zinc-200">{getItemName(r.item_name)}</span>
                </div>
              </td>
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
