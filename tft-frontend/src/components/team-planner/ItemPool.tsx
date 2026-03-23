import { useDraggable } from '@dnd-kit/core';
import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import type { DragItemPayload } from './types';


function DraggableItem({ apiName }: { apiName: string }) {
  const { getItemData } = useTftAssets();
  const item = getItemData(apiName);
  const src = item.icon || PLACEHOLDER_URL;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item:${apiName}`,
    data: { source: 'item', itemApiName: apiName } satisfies DragItemPayload,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      title={item.name}
      className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-700/40 transition hover:ring-zinc-500/60 hover:-translate-y-0.5 hover:shadow-md bg-zinc-950 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <img
        src={src}
        alt={item.name}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src !== PLACEHOLDER_URL) img.src = PLACEHOLDER_URL;
        }}
      />
    </button>
  );
}

export function ItemPool() {
  const { itemMap } = useTftAssets();

  const items = Array.from(itemMap.values())
    .filter((item) => {
      const api = item.apiName.toLowerCase();
      return (
        api.startsWith('tft_item_') &&
        !api.includes('_uncraft') &&
        !api.includes('_debug') &&
        !api.includes('armorykey') &&
        !api.includes('emblem') &&
        item.name.trim().length > 0
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded-md border border-zinc-600/50 bg-zinc-800/50 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-zinc-300">
          Items
        </span>
        <span className="text-[9px] text-zinc-600">{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <DraggableItem key={item.apiName} apiName={item.apiName} />
        ))}
      </div>
    </div>
  );
}
