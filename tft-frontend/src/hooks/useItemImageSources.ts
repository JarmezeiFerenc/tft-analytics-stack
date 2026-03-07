import { useEffect, useState } from 'react';
import { resolveItemImageUrls } from '../utils/cdragon';

export function useItemImageSources(itemId: string | null): string[] {
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    if (!itemId) {
      setSources([]);
      return () => {
        mounted = false;
      };
    }

    resolveItemImageUrls(itemId)
      .then((resolved) => {
        if (mounted) {
          setSources(resolved);
        }
      })
      .catch(() => {
        if (mounted) {
          setSources([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [itemId]);

  return sources;
}
