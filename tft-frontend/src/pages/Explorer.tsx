import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { ExplorerHeader } from '../components/explorer/ExplorerHeader';
import { ExplorerSidebar } from '../components/explorer/ExplorerSidebar';
import { ExplorerSummaryStats } from '../components/explorer/ExplorerSummaryStats';
import { ExplorerTabs } from '../components/explorer/ExplorerTabs';
import { ItemCombinationsTab } from '../components/explorer/ItemCombinationsTab';
import { SingleItemsTab } from '../components/explorer/SingleItemsTab';
import { TraitStatsTab } from '../components/explorer/TraitStatsTab';
import type {
  ItemComboRow,
  SingleItemRow,
  SummaryData,
  TabId,
  TraitStatRow,
  UnitFilter,
} from '../components/explorer/types';
import { useTftAssets } from '../context/TftAssetContext';

const API_BASE = 'http://127.0.0.1:8000/api';
const DEBOUNCE_MS = 600;
const MIN_GAMES_OPTIONS = [10, 25, 50, 100, 300, 500, 1000, 3000] as const;


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
        <Loader2 size={24} className="mr-2 animate-spin" /> Loading asset data...
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

      <ExplorerSidebar
        allTraitKeys={allTraitKeys}
        allUnitKeys={allUnitKeys}
        allItemKeys={allItemKeys}
        traitSet={traitSet}
        unitIdSet={unitIdSet}
        selectedTraits={selectedTraits}
        selectedUnits={selectedUnits}
        minGames={minGames}
        minGamesOptions={MIN_GAMES_OPTIONS}
        addTrait={addTrait}
        removeTrait={removeTrait}
        addUnit={addUnit}
        removeUnit={removeUnit}
        updateUnit={updateUnit}
        setMinGames={setMinGames}
        sidebarOpen={sidebarOpen}
      />

      {/* Right main area */}
      <main className="flex-1 space-y-4">
        <ExplorerHeader selectedUnits={selectedUnits} selectedTraits={selectedTraits} />

        {summary && summary.total_games > 0 && (
          <ExplorerSummaryStats summary={summary} placementColor={placementColor} rateColor={rateColor} />
        )}

        <ExplorerTabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-zinc-400">
            <Loader2 size={18} className="animate-spin" /> Querying…
          </div>
        )}

        {!loading && activeTab === 'items' && <ItemCombinationsTab rows={itemRows} />}
        {!loading && activeTab === 'traits' && <TraitStatsTab rows={traitRows} />}
        {!loading && activeTab === 'single_items' && <SingleItemsTab rows={singleRows} />}
      </main>
    </div>
  );
}
