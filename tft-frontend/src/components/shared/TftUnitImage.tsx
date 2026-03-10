import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';

interface TftUnitImageProps {
  unitId?: string;
  apiName?: string;
  className?: string;
}

export function TftUnitImage({ unitId, apiName, className }: TftUnitImageProps) {
  const resolvedId = unitId ?? apiName ?? '';
  const { unitMap } = useTftAssets();
  const src = unitMap.get(resolvedId.toLowerCase()) ?? PLACEHOLDER_URL;

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
