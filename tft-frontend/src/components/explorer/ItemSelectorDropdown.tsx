import { useMemo } from 'react';
import { TftItemIcon as TftItemImage } from '../shared/TftItemIcon';
import { SearchableDropdown } from './SearchableDropdown';

interface ItemSelectorDropdownProps {
  allItems: string[];
  selected: Set<string>;
  onSelect: (key: string) => void;
}

function isBlockedExplorerItem(key: string): boolean {
  const normalized = key.toLowerCase();
  const blockedWords = ['augment', 'consumable', 'mod', 'tutorial', 'corrupted'];
  return blockedWords.some((word) => normalized.includes(word)) || normalized.startsWith('tft_item_empty');
}

export function ItemSelectorDropdown({ allItems, selected, onSelect }: ItemSelectorDropdownProps) {
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
