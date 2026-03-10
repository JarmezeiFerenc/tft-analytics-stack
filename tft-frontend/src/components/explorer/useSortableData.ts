import { useMemo, useState } from 'react';
import type { SortConfig } from './types';

export function useSortableData<T extends object>(
  items: T[],
  defaultConfig: SortConfig<T> | null = null,
) {
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
