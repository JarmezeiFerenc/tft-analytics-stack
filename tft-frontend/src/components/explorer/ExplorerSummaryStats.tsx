import type { SummaryData } from './types';

interface ExplorerSummaryStatsProps {
  summary: SummaryData;
  placementColor: (avg: number) => string;
  rateColor: (val: number) => string;
}

export function ExplorerSummaryStats({
  summary,
  placementColor,
  rateColor,
}: ExplorerSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[
        { label: 'Sample Size', value: summary.total_games.toLocaleString(), accent: 'text-zinc-100' },
        {
          label: 'Avg Placement',
          value: String(summary.avg_placement),
          accent: placementColor(summary.avg_placement),
        },
        { label: 'Top 4 Rate', value: `${summary.top4_rate}%`, accent: rateColor(summary.top4_rate) },
        { label: 'Win Rate', value: `${summary.win_rate}%`, accent: rateColor(summary.win_rate * 4) },
        { label: 'Avg Level', value: String(summary.avg_level), accent: 'text-zinc-100' },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</p>
          <p className={`mt-1 text-lg font-semibold ${s.accent}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
