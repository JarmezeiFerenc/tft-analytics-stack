import { useMemo } from 'react';
import { AssetImage } from './AssetImage';
import { getUnitImageUrls } from '../utils/cdragon';

type TftUnitImageProps = {
  unitId: string;
  size?: number;
};

export function TftUnitImage({ unitId, size = 88 }: TftUnitImageProps) {
  const sources = useMemo(() => getUnitImageUrls(unitId), [unitId]);

  return (
    <AssetImage
      sources={sources}
      alt={`Unit ${unitId}`}
      width={size}
      height={size}
      borderRadius={14}
      border="3px solid #d4af37"
      placeholderLabel="N/A"
    />
  );
}
