import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { TftItemIcon } from '../components/TftItemIcon';
import { TftUnitImage } from '../components/TftUnitImage';

type UnitStatsRow = {
  item_1: string | null;
  item_2: string | null;
  item_3: string | null;
  games_played: number | string;
  avg_placement: number | string;
};

export default function Explorer() {
  const [characterId, setCharacterId] = useState('TFT16_Aatrox');
  const [tier, setTier] = useState('any');
  const [minGames, setMinGames] = useState('1');
  const [sortBy, setSortBy] = useState<'performance' | 'popularity'>('performance');
  const [rows, setRows] = useState<UnitStatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItems = useMemo(
    () => [rows[0]?.item_1, rows[0]?.item_2, rows[0]?.item_3].filter(Boolean) as string[],
    [rows]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (tier.trim().length > 0) {
        searchParams.set('tier', tier.trim());
      }
      if (minGames.trim().length > 0) {
        searchParams.set('min_games', minGames.trim());
      }
      searchParams.set('sort_by', sortBy);

      const query = searchParams.toString();
      const response = await fetch(
        `http://127.0.0.1:8000/api/unit-stats/${encodeURIComponent(characterId)}${query ? `?${query}` : ''}`
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format.');
      }

      setRows(data as UnitStatsRow[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Request failed: ${message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-dashboard-border bg-dashboard-card/80 p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Explorer</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Drill into unit item combinations with sample-size filtering and dual sorting.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-dashboard-border bg-zinc-900/60 px-3 py-2">
          <TftUnitImage unitId={characterId} size={72} />
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Selected Unit</p>
            <p className="text-sm font-medium text-zinc-100">{characterId}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {selectedItems.slice(0, 3).map((itemId) => (
                <TftItemIcon key={itemId} itemId={itemId} size={24} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-2xl border border-dashboard-border bg-dashboard-card/80 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Character ID</span>
          <input
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="TFT13_Akali"
            required
            className="w-full rounded-xl border border-dashboard-border bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Tier</span>
          <input
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder="any"
            className="w-full rounded-xl border border-dashboard-border bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Minimum Games</span>
          <input
            value={minGames}
            onChange={(e) => setMinGames(e.target.value)}
            placeholder="1"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-xl border border-dashboard-border bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">Sort Mode</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'performance' | 'popularity')}
            className="w-full rounded-xl border border-dashboard-border bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-indigo-500/70 transition focus:ring"
          >
            <option value="performance">Performance</option>
            <option value="popularity">Popularity</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading || characterId.trim().length === 0}
          className="h-fit self-end rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Stats'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card/60 px-4 py-5 text-sm text-zinc-400">
          No results yet. Submit a unit to test the API.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-dashboard-border bg-dashboard-card/80">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="border-b border-dashboard-border bg-zinc-900/60 text-zinc-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Games Played</th>
                <th className="px-4 py-3 text-left font-medium">Avg Placement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const itemIds = [row.item_1, row.item_2, row.item_3].filter(Boolean) as string[];
                return (
                  <tr key={`${row.item_1 ?? 'none'}-${row.item_2 ?? 'none'}-${row.item_3 ?? 'none'}-${index}`} className="border-b border-dashboard-border/60 last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      {itemIds.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {itemIds.map((itemId) => (
                              <TftItemIcon key={`${itemId}-${index}`} itemId={itemId} size={30} />
                            ))}
                          </div>
                          <p className="text-xs text-zinc-500">{itemIds.join(', ')}</p>
                        </div>
                      ) : (
                        <span className="text-zinc-500">No items</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{row.games_played}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.avg_placement}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
