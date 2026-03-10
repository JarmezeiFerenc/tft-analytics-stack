import { useMemo } from 'react';
import { X } from 'lucide-react';
import { TftItemIcon as TftItemImage } from '../shared/TftItemIcon';
import { ItemSelectorDropdown } from './ItemSelectorDropdown';
import type { UnitFilter } from './types';

interface ItemPickerProps {
  allItems: string[];
  unitFilter: UnitFilter;
  onChange: (updated: UnitFilter) => void;
}

export function ItemPicker({ allItems, unitFilter, onChange }: ItemPickerProps) {
  const selectedSet = useMemo(() => new Set(unitFilter.items), [unitFilter.items]);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-2">
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
