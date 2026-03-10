import { TftItemIcon as TftItemImage } from '../shared/TftItemIcon';
import { TftUnitImage } from '../shared/TftUnitImage';
import { EmptyTab } from './EmptyTab';
import { SortHeader } from './SortHeader';
import type { ItemComboRow } from './types';
import { useSortableData } from './useSortableData';

interface ItemCombinationsTabProps {
  rows: ItemComboRow[];
}

export function ItemCombinationsTab({ rows }: ItemCombinationsTabProps) {
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
            <th className="px-4 py-2.5 text-left font-medium">Items</th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Games"
                sortKey="games_played"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof ItemComboRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Avg Place"
                sortKey="avg_placement"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof ItemComboRow)}
              />
            </th>
            <th className="px-4 py-2.5 text-left">
              <SortHeader
                label="Top 4%"
                sortKey="top4_rate"
                sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null}
                onSort={(key) => requestSort(key as keyof ItemComboRow)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const items = [r.item_1, r.item_2, r.item_3].filter(Boolean) as string[];
            return (
              <tr key={i} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {r.unit_id && (
                      <TftUnitImage
                        apiName={r.unit_id}
                        className="h-8 w-8 rounded-lg border border-[#d4af37] object-cover"
                      />
                    )}
                    {items.length > 0 ? (
                      <div className="flex gap-1.5">
                        {items.map((id, j) => (
                          <TftItemImage
                            key={j}
                            apiName={id}
                            className="h-8 w-8 rounded-md border border-zinc-600 object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500">No items</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-zinc-300">{r.games_played}</td>
                <td className="px-4 py-2.5 font-medium text-zinc-100">{r.avg_placement}</td>
                <td className="px-4 py-2.5 text-zinc-300">{r.top4_rate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
