import { useTftAssets } from '../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../utils/cdragon';

interface TftItemImageProps {
  apiName: string;
  className?: string;
}

export function TftItemImage({ apiName, className }: TftItemImageProps) {
  const { itemMap } = useTftAssets();
  const src = itemMap.get(apiName.toLowerCase()) ?? PLACEHOLDER_URL;

  return (
    <img
      src={src}
      alt={apiName}
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
