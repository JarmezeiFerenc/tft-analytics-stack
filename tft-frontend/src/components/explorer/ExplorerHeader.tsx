import { TftUnitImage } from '../shared/TftUnitImage';
import { TftTraitIcon } from '../shared/TftTraitIcon';
import type { UnitFilter } from './types';

interface ExplorerHeaderProps {
  selectedUnits: UnitFilter[];
  selectedTraits: string[];
}

export function ExplorerHeader({ selectedUnits, selectedTraits }: ExplorerHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex-1">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Explorer</h2>
        <p className="mt-0.5 text-xs text-zinc-400">Build filters on the left, results update automatically.</p>
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
  );
}
