import type { ReactElement } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';

interface TraitLike {
  name: string;
  numUnits: number;
  style: number;
}

interface MatchLike {
  myPlacement: number | null;
  myTraits: TraitLike[];
}

interface PlacementPoint {
  matchIndex: number;
  placement: number;
  mainTrait: string;
}

interface PlacementChartProps {
  matches: MatchLike[];
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: PlacementPoint;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{ payload?: PlacementPoint }>;
}

function getMainTrait(traits: TraitLike[]): string {
  if (!Array.isArray(traits) || traits.length === 0) {
    return 'Unknown';
  }

  const best = [...traits]
    .filter((t) => t.style > 0)
    .sort((a, b) => {
      if (b.style !== a.style) return b.style - a.style;
      return b.numUnits - a.numUnits;
    })[0];

  return best ? best.name.replace(/^TFT\d+_/, '') : 'Unknown';
}

function dotColor(placement: number): string {
  if (placement === 1) return '#fbbf24';
  if (placement >= 2 && placement <= 4) return '#2dd4bf';
  return '#ef4444';
}

function CustomDot({ cx, cy, payload }: DotProps): ReactElement | null {
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={dotColor(payload.placement)}
      stroke="#18181b"
      strokeWidth={1.5}
    />
  );
}

function CustomTooltip({ active, payload }: CustomTooltipProps): ReactElement | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as PlacementPoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-zinc-100">Placement: #{point.placement}</p>
      <p className="mt-1 text-zinc-400">Comp: {point.mainTrait}</p>
    </div>
  );
}

export function PlacementChart({ matches }: PlacementChartProps) {
  const chartData: PlacementPoint[] = [...matches]
    .reverse()
    .map((match, index) => ({
      matchIndex: index + 1,
      placement: Math.min(8, Math.max(1, Number(match.myPlacement ?? 8))),
      mainTrait: getMainTrait(match.myTraits),
    }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-500">
        No placement data available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">Placement History</h4>
        <span className="text-xs text-zinc-500">Oldest to newest</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 6, bottom: 4 }}>
            <XAxis
              dataKey="matchIndex"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              interval="preserveStartEnd"
            />
            <YAxis
              type="number"
              domain={[1, 8]}
              reversed
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              width={24}
            />
            <Tooltip cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }} content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="placement"
              stroke="#64748b"
              strokeWidth={2.25}
              dot={<CustomDot />}
              activeDot={{ r: 6, stroke: '#e4e4e7', strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
