import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';

interface TftItemIconProps {
  itemId?: string;
  apiName?: string;
  className?: string;
}

export function TftItemIcon({ itemId, apiName, className }: TftItemIconProps) {
  const resolvedId = itemId ?? apiName ?? '';
  const { itemMap } = useTftAssets();
  const src = itemMap.get(resolvedId.toLowerCase()) ?? PLACEHOLDER_URL;

  return (
    <img
      src={src}
      alt={resolvedId}
      className={className}
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== PLACEHOLDER_URL) {
          img.src = PLACEHOLDER_URL;
        }
      }}
    />
  );
}
