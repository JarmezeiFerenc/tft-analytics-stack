import { useTftAssets } from '../../context/TftAssetContext';
import { PLACEHOLDER_URL } from '../../utils/cdragon';
import { TftHoverTooltip } from './TftHoverTooltip';

interface TftTraitIconProps {
  apiName: string;
  className?: string;
  style?: number;
  numUnits?: number;
  showTooltip?: boolean;
}

function tierBackground(style: number): string {
  if (style >= 4) return 'bg-gradient-to-br from-purple-500 to-blue-500';
  if (style === 3) return 'bg-yellow-400';
  if (style === 2) return 'bg-slate-400';
  if (style === 1) return 'bg-amber-800';
  return 'bg-zinc-800';
}

export function TftTraitIcon({ apiName, className, style = 0, numUnits, showTooltip = true }: TftTraitIconProps) {
  const { traitMap, getTraitData } = useTftAssets();
  const src = traitMap.get(apiName.toLowerCase())?.icon ?? PLACEHOLDER_URL;
  const background = tierBackground(style);
  const trait = getTraitData(apiName);

  const content = (
    <div className={`relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] shadow-inner ${background} ${className ?? ''}`}>
      <img
        src={src}
        alt={trait.name}
        className="h-5 w-5 object-contain"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src !== PLACEHOLDER_URL) {
            img.src = PLACEHOLDER_URL;
          }
        }}
      />
      {typeof numUnits === 'number' && (
        <span className="pointer-events-none absolute -bottom-1.5 right-[-5px] rounded-full bg-zinc-950/90 px-1 text-[9px] font-semibold leading-4 text-zinc-100 ring-1 ring-zinc-700">
          {numUnits}
        </span>
      )}
    </div>
  );

  return (
    <TftHoverTooltip
      showTooltip={showTooltip}
      title={trait.name}
      description={trait.desc}
    >
      {content}
    </TftHoverTooltip>
  );
}
