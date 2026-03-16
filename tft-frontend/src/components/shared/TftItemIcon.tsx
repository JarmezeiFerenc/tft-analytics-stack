import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftHoverTooltip } from './TftHoverTooltip';

interface TftItemIconProps {
  itemId?: string;
  apiName?: string;
  className?: string;
  showTooltip?: boolean;
}

export function TftItemIcon({ itemId, apiName, className, showTooltip = true }: TftItemIconProps) {
  const resolvedId = itemId ?? apiName ?? '';
  const { itemMap, getItemData } = useTftAssets();
  const src = itemMap.get(resolvedId.toLowerCase())?.icon ?? PLACEHOLDER_URL;
  const item = getItemData(resolvedId);

  const image = (
    <img
      src={src}
      alt={item.name}
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

  return (
    <TftHoverTooltip
      showTooltip={showTooltip}
      title={item.name}
      description={item.desc}
    >
      {image}
    </TftHoverTooltip>
  );
}
