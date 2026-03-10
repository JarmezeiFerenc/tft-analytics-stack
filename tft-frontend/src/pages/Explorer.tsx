import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TftItemIcon as TftItemImage } from '../components/shared/TftItemIcon';
import { TftUnitImage } from '../components/shared/TftUnitImage';
import { TftTraitIcon } from '../components/shared/TftTraitIcon';
import { useTftAssets } from '../context/TftAssetContext';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Loader2, Search, Trash2, X } from 'lucide-react';

interface UnitFilter {
  id: string;
  items: string[];
  itemCount: number | null;
}

type TabId = 'items' | 'traits' | 'single_items';

interface ItemComboRow {
  unit_id: string;
  item_1: string | null;
  item_2: string | null;
  item_3: string | null;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

interface TraitStatRow {
  trait_name: string;
  max_style: number;
  avg_units: number;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

interface SingleItemRow {
  unit_id: string;
  item_name: string;
  games_played: number;
  avg_placement: number;
  top4_rate: number;
}

interface SummaryData {
  total_games: number;
  avg_placement: number;
  top4_rate: number;
  win_rate: number;
  avg_level: number;
}

interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

const API_BASE = 'http://127.0.0.1:8000/api';
const DEBOUNCE_MS = 600;
const MIN_GAMES_OPTIONS = [10, 25, 50, 100, 300, 500, 1000, 3000] as const;

function useSortableData<T extends object>(items: T[], defaultConfig: SortConfig<T> | null = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultConfig);

  const sorted = useMemo(() => {
    if (!sortConfig) return items;
    const { key, direction } = sortConfig;
    return [...items].sort((a, b) => {
      const aVal = a[key] as number | string | null;
      const bVal = b[key] as number | string | null;
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  return { sorted, sortConfig, requestSort };
}

function SortHeader({ label, sortKey, sortConfig, onSort }: {
  label: string;
  sortKey: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}) {
  const active = sortConfig?.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium hover:text-zinc-200 transition-colors"
    >
      {label}
      {!active && <ArrowUpDown size={12} className="text-zinc-600" />}
      {active && sortConfig?.direction === 'asc' && <ArrowUp size={12} className="text-indigo-400" />}
      {active && sortConfig?.direction === 'desc' && <ArrowDown size={12} className="text-indigo-400" />}
    </button>
  );
}


function placementColor(avg: number): string {
  if (avg <= 3) return 'text-emerald-400';
  if (avg <= 4) return 'text-yellow-400';
  return 'text-red-400';
}

function rateColor(val: number): string {
  if (val >= 70) return 'text-emerald-400';
  if (val >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function isBlockedExplorerItem(key: string): boolean {
  const normalized = key.toLowerCase();
  const blockedWords = ['augment', 'consumable', 'mod', 'tutorial', 'corrupted'];
  return blockedWords.some((word) => normalized.includes(word)) || normalized.startsWith('tft_item_empty');
}

/*  Searchable Dropdown (shared)  */

function SearchableDropdown({
  entries,
  selected,
  onSelect,
  placeholder,
  renderOption,
}: {
  entries: string[];
  selected: Set<string>;
  onSelect: (key: string) => void;
  placeholder: string;
  renderOption: (key: string) => React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((k) => !selected.has(k) && k.toLowerCase().includes(q)).slice(0, 30);
  }, [entries, selected, query]);

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
          {filtered.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { onSelect(key); setQuery(''); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
            >
              {renderOption(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemSelectorDropdown({
  allItems,
  selected,
  onSelect,
}: {
  allItems: string[];
  selected: Set<string>;
  onSelect: (key: string) => void;
}) {
  const explorerItems = useMemo(
    () => allItems.filter((key) => key.startsWith('tft_item_') && !isBlockedExplorerItem(key)),
    [allItems],
  );

  return (
    <SearchableDropdown
      entries={explorerItems}
      selected={selected}
      onSelect={onSelect}
      placeholder="Pin an item..."
      renderOption={(key) => (
        <>
          <TftItemImage apiName={key} className="h-5 w-5 rounded object-cover" />
          <span className="truncate">{key.replace(/^TFT\d+_Item_|^TFT_Item_/i, '')}</span>
        </>
      )}
    />
  );
}

/*  Item Picker for a UnitFilter  */

function ItemPicker({
  allItems,
  unitFilter,
  onChange,
}: {
  allItems: string[];
  unitFilter: UnitFilter;
  onChange: (updated: UnitFilter) => void;
}) {
  const selectedSet = useMemo(() => new Set(unitFilter.items), [unitFilter.items]);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-2">
      {/* Item count restriction */}
      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="shrink-0">Items:</span>
        <select
          value={unitFilter.itemCount ?? 'any'}
          onChange={(e) =>
            onChange({ ...unitFilter, itemCount: e.target.value === 'any' ? null : Number(e.target.value) })
          }
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
        >
          <option value="any">Any count</option>
          <option value="0">Exactly 0</option>
          <option value="1">Exactly 1</option>
          <option value="2">Exactly 2</option>
          <option value="3">Exactly 3</option>
        </select>
      </label>

      {/* Pinned items */}
      {unitFilter.items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unitFilter.items.map((item) => (
            <div key={item} className="group relative">
              <TftItemImage apiName={item} className="h-7 w-7 rounded-md border border-zinc-500 object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...unitFilter, items: unitFilter.items.filter((i) => i !== item) })}
                className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] text-white group-hover:flex"
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add item dropdown */}
      {unitFilter.items.length < 3 && (
        <ItemSelectorDropdown
          allItems={allItems}
          selected={selectedSet}
          onSelect={(key) => onChange({ ...unitFilter, items: [...unitFilter.items, key] })}
        />
      )}
    </div>
  );
}

/*  Tab components  */

function ItemCombinationsTab({ rows }: { rows: ItemComboRow[] }) {
  const { sorted, sortConfig, requestSort } = useSortableData(rows, { key: 'games_played', direction: 'desc' });
  if (rows.length === 0) return <EmptyTab />;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[600px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Items</th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Games" sortKey="games_played" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof ItemComboRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Avg Place" sortKey="avg_placement" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof ItemComboRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Top 4%" sortKey="top4_rate" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof ItemComboRow)} /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const items = [r.item_1, r.item_2, r.item_3].filter(Boolean) as string[];
            return (
              <tr key={i} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {r.unit_id && <TftUnitImage apiName={r.unit_id} className="h-8 w-8 rounded-lg border border-[#d4af37] object-cover" />}
                    {items.length > 0 ? (
                      <div className="flex gap-1.5">
                        {items.map((id, j) => (
                          <TftItemImage key={j} apiName={id} className="h-8 w-8 rounded-md border border-zinc-600 object-cover" />
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

function TraitStatsTab({ rows }: { rows: TraitStatRow[] }) {
  const { sorted, sortConfig, requestSort } = useSortableData(rows, { key: 'games_played', direction: 'desc' });
  if (rows.length === 0) return <EmptyTab />;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[600px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Trait</th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Avg Units" sortKey="avg_units" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof TraitStatRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Games" sortKey="games_played" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof TraitStatRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Avg Place" sortKey="avg_placement" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof TraitStatRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Top 4%" sortKey="top4_rate" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof TraitStatRow)} /></th>
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

function SingleItemsTab({ rows }: { rows: SingleItemRow[] }) {
  const { sorted, sortConfig, requestSort } = useSortableData(rows, { key: 'games_played', direction: 'desc' });
  if (rows.length === 0) return <EmptyTab />;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70">
      <table className="min-w-[500px] w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Item</th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Games" sortKey="games_played" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof SingleItemRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Avg Place" sortKey="avg_placement" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof SingleItemRow)} /></th>
            <th className="px-4 py-2.5 text-left"><SortHeader label="Top 4%" sortKey="top4_rate" sortConfig={sortConfig ? { key: String(sortConfig.key), direction: sortConfig.direction } : null} onSort={(key) => requestSort(key as keyof SingleItemRow)} /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {r.unit_id && <TftUnitImage apiName={r.unit_id} className="h-8 w-8 rounded-lg border border-[#d4af37] object-cover" />}
                  <TftItemImage apiName={r.item_name} className="h-8 w-8 rounded-md border border-zinc-600 object-cover" />
                  <span className="text-zinc-200">{r.item_name.replace(/^TFT\d+_Item_|^TFT_Item_/i, '')}</span>
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

function EmptyTab() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
      Add at least one unit in the sidebar, then results will appear here.
    </div>
  );
}

/*  Main Explorer Page */

const TABS: { id: TabId; label: string }[] = [
  { id: 'items', label: 'Item Combos' },
  { id: 'traits', label: 'Trait Stats' },
  { id: 'single_items', label: 'Single Items' },
];

export default function Explorer() {
  const { unitMap, traitMap, itemMap, ready } = useTftAssets();

  const allUnitKeys = useMemo(() => [...unitMap.keys()].sort(), [unitMap]);
  const allTraitKeys = useMemo(() => [...traitMap.keys()].sort(), [traitMap]);
  const allItemKeys = useMemo(() => [...itemMap.keys()].sort(), [itemMap]);

  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<UnitFilter[]>([]);
  const [minGames, setMinGames] = useState(10);

  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [itemRows, setItemRows] = useState<ItemComboRow[]>([]);
  const [traitRows, setTraitRows] = useState<TraitStatRow[]>([]);
  const [singleRows, setSingleRows] = useState<SingleItemRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const traitSet = useMemo(() => new Set(selectedTraits), [selectedTraits]);
  const unitIdSet = useMemo(() => new Set(selectedUnits.map((u) => u.id)), [selectedUnits]);

  const addTrait = (key: string) => setSelectedTraits((prev) => [...prev, key]);
  const removeTrait = (key: string) => setSelectedTraits((prev) => prev.filter((t) => t !== key));

  const addUnit = (key: string) =>
    setSelectedUnits((prev) => [...prev, { id: key, items: [], itemCount: null }]);
  const removeUnit = (key: string) =>
    setSelectedUnits((prev) => prev.filter((u) => u.id !== key));
  const updateUnit = (key: string, updated: UnitFilter) =>
    setSelectedUnits((prev) => prev.map((u) => (u.id === key ? updated : u)));

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(
    async (tab: TabId, traits: string[], units: UnitFilter[], min: number) => {
      if (units.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(`${API_BASE}/explorer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ tab, traits, units, min_games: min }),
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${text}`);
        }

        const data = await resp.json();
        setSummary(data.summary as SummaryData);

        const results = data.results;
        if (tab === 'items') setItemRows(results as ItemComboRow[]);
        else if (tab === 'traits') setTraitRows(results as TraitStatRow[]);
        else setSingleRows(results as SingleItemRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedUnits.length === 0) {
      setItemRows([]);
      setTraitRows([]);
      setSingleRows([]);
      setSummary(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchResults(activeTab, selectedTraits, selectedUnits, minGames);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeTab, selectedTraits, selectedUnits, minGames, fetchResults]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-20 text-zinc-400">
        <Loader2 size={24} className="mr-2 animate-spin" /> Loading asset data…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      {/*  Mobile toggle  */}
      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 lg:hidden"
      >
        <ChevronDown size={16} className={sidebarOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
        Filters ({selectedUnits.length} units, {selectedTraits.length} traits)
      </button>

      {/* Left sidebar */}
      <aside
        className={`w-full shrink-0 space-y-4 lg:block lg:w-72 xl:w-80 ${sidebarOpen ? '' : 'hidden lg:block'}`}
      >
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-5">
          {/* Trait Selector  */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Required Traits</h3>
            <SearchableDropdown
              entries={allTraitKeys}
              selected={traitSet}
              onSelect={addTrait}
              placeholder="Search traits…"
              renderOption={(key) => (
                <>
                  <TftTraitIcon apiName={key} className="!h-6 !w-6" />
                  <span className="truncate">{key.replace(/^tft\d+_/i, '')}</span>
                </>
              )}
            />
            {selectedTraits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTraits.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTrait(t)}
                    className="group flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:border-red-500/50 hover:bg-red-500/10"
                  >
                    <TftTraitIcon apiName={t} className="!h-5 !w-5" />
                    <span className="truncate max-w-[80px]">{t.replace(/^tft\d+_/i, '')}</span>
                    <X size={10} className="ml-0.5 shrink-0 text-zinc-500 group-hover:text-red-400" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Unit Selector */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Units</h3>
            <SearchableDropdown
              entries={allUnitKeys}
              selected={unitIdSet}
              onSelect={addUnit}
              placeholder="Search units…"
              renderOption={(key) => (
                <>
                  <TftUnitImage apiName={key} className="h-6 w-6 rounded object-cover" />
                  <span className="truncate">{key.replace(/^tft\d+_/i, '')}</span>
                </>
              )}
            />

            {selectedUnits.length > 0 && (
              <div className="mt-3 space-y-3">
                {selectedUnits.map((uf) => (
                  <div key={uf.id} className="rounded-xl border border-zinc-700/60 bg-zinc-800/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <TftUnitImage apiName={uf.id} className="h-9 w-9 rounded-lg border border-[#d4af37] object-cover" />
                      <span className="flex-1 truncate text-sm font-medium text-zinc-100">
                        {uf.id.replace(/^tft\d+_/i, '')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUnit(uf.id)}
                        className="rounded-md p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ItemPicker
                      allItems={allItemKeys}
                      unitFilter={uf}
                      onChange={(updated) => updateUnit(uf.id, updated)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Min Games */}
          <section>
            <label className="mb-1 block text-xs text-zinc-400">Min Games</label>
            <select
              value={minGames}
              onChange={(e) => setMinGames(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1.5 text-xs text-zinc-100 outline-none transition focus:ring-2 focus:ring-indigo-500"
            >
              {MIN_GAMES_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </section>
        </div>
      </aside>

      {/* Right main area */}
      <main className="flex-1 space-y-4">
        {/* Header with selected preview */}
        <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Explorer</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Build filters on the left, results update automatically.
            </p>
          </div>
          {selectedUnits.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedUnits.map((uf) => (
                <TftUnitImage
                  key={uf.id}
                  apiName={uf.id}
                  className="h-10 w-10 rounded-xl border-2 border-[#d4af37] object-cover"
                />
              ))}
              {selectedTraits.map((t) => (
                <TftTraitIcon key={t} apiName={t} className="!h-8 !w-8" />
              ))}
            </div>
          )}
        </header>

        {/* Summary Stats */}
        {summary && summary.total_games > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Sample Size', value: summary.total_games.toLocaleString(), accent: 'text-zinc-100' },
              { label: 'Avg Placement', value: String(summary.avg_placement), accent: placementColor(summary.avg_placement) },
              { label: 'Top 4 Rate', value: `${summary.top4_rate}%`, accent: rateColor(summary.top4_rate) },
              { label: 'Win Rate', value: `${summary.win_rate}%`, accent: rateColor(summary.win_rate * 4) },
              { label: 'Avg Level', value: String(summary.avg_level), accent: 'text-zinc-100' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</p>
                <p className={`mt-1 text-lg font-semibold ${s.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === t.id
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-zinc-400">
            <Loader2 size={18} className="animate-spin" /> Querying…
          </div>
        )}

        {/* Tab content */}
        {!loading && activeTab === 'items' && <ItemCombinationsTab rows={itemRows} />}
        {!loading && activeTab === 'traits' && <TraitStatsTab rows={traitRows} />}
        {!loading && activeTab === 'single_items' && <SingleItemsTab rows={singleRows} />}
      </main>
    </div>
  );
}
