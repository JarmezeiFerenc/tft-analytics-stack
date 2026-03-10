import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortState } from './types';

interface SortHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortState | null;
  onSort: (key: string) => void;
}

export function SortHeader({ label, sortKey, sortConfig, onSort }: SortHeaderProps) {
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
