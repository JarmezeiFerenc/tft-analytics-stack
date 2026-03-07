import { AssetImage } from './AssetImage';
import { useItemImageSources } from '../hooks/useItemImageSources';

type TftItemIconProps = {
  itemId: string;
  size?: number;
};

export function TftItemIcon({ itemId, size = 32 }: TftItemIconProps) {
  const sources = useItemImageSources(itemId);

  return (
    <AssetImage
      sources={sources}
      alt={itemId}
      width={size}
      height={size}
      borderRadius={6}
      border="1px solid #b8b8b8"
      placeholderLabel="?"
    />
  );
}
