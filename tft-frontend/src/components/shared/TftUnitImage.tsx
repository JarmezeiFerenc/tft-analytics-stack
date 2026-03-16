import { useTftMetadata } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftHoverTooltip } from './TftHoverTooltip';

interface TftUnitImageProps {
  unitId?: string;
  apiName?: string;
  className?: string;
  showTooltip?: boolean;
}

const COST_BADGE: Record<number, string> = {
  1: 'border-zinc-500/60 bg-zinc-800 text-zinc-100',
  2: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
  3: 'border-sky-500/50 bg-sky-500/15 text-sky-200',
  4: 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-200',
  5: 'border-amber-400/50 bg-amber-400/15 text-amber-100',
};

export function TftUnitImage({ unitId, apiName, className, showTooltip = true }: TftUnitImageProps) {
  const resolvedId = unitId ?? apiName ?? '';
  const { unitMap, getChampionData } = useTftMetadata();
  const src = unitMap.get(resolvedId.toLowerCase()) ?? PLACEHOLDER_URL;
  const champion = getChampionData(resolvedId);

  const image = (
    <img
      src={src}
      alt={champion.name}
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

  const badge = champion.cost ? (
    <span
      className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        COST_BADGE[champion.cost] ?? COST_BADGE[1]
      }`}
    >
      {champion.cost} Cost
    </span>
  ) : undefined;

  return (
    <TftHoverTooltip
      showTooltip={showTooltip}
      title={champion.name}
      subtitle={champion.abilityName}
      description={champion.abilityDesc}
      badge={badge}
    >
      {image}
    </TftHoverTooltip>
  );
}

export const TftChampionIcon = TftUnitImage;
