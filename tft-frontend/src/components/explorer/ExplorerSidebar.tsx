import { Trash2, X } from 'lucide-react';
import { TftTraitIcon } from '../shared/TftTraitIcon';
import { TftUnitImage } from '../shared/TftUnitImage';
import { ItemPicker } from './ItemPicker';
import { SearchableDropdown } from './SearchableDropdown';
import type { UnitFilter } from './types';

interface ExplorerSidebarProps {
  allTraitKeys: string[];
  allUnitKeys: string[];
  allItemKeys: string[];
  traitSet: Set<string>;
  unitIdSet: Set<string>;
  selectedTraits: string[];
  selectedUnits: UnitFilter[];
  minGames: number;
  minGamesOptions: readonly number[];
  addTrait: (key: string) => void;
  removeTrait: (key: string) => void;
  addUnit: (key: string) => void;
  removeUnit: (key: string) => void;
  updateUnit: (key: string, updated: UnitFilter) => void;
  setMinGames: (value: number) => void;
  sidebarOpen: boolean;
}

export function ExplorerSidebar({
  allTraitKeys,
  allUnitKeys,
  allItemKeys,
  traitSet,
  unitIdSet,
  selectedTraits,
  selectedUnits,
  minGames,
  minGamesOptions,
  addTrait,
  removeTrait,
  addUnit,
  removeUnit,
  updateUnit,
  setMinGames,
  sidebarOpen,
}: ExplorerSidebarProps) {
  return (
    <aside
      className={`w-full shrink-0 space-y-4 lg:block lg:w-72 xl:w-80 ${sidebarOpen ? '' : 'hidden lg:block'}`}
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-5">
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
                    <TftUnitImage
                      apiName={uf.id}
                      className="h-9 w-9 rounded-lg border border-[#d4af37] object-cover"
                    />
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

        <section>
          <label className="mb-1 block text-xs text-zinc-400">Min Games</label>
          <select
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1.5 text-xs text-zinc-100 outline-none transition focus:ring-2 focus:ring-indigo-500"
          >
            {minGamesOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </section>
      </div>
    </aside>
  );
}
