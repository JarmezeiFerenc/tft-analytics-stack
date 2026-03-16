import type { ReactNode } from 'react';

interface TftHoverTooltipProps {
  children: ReactNode;
  showTooltip?: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: ReactNode;
}

export function TftHoverTooltip({
  children,
  showTooltip = true,
  title,
  subtitle,
  description,
  badge,
}: TftHoverTooltipProps) {
  if (!showTooltip) {
    return <>{children}</>;
  }

  const hasTooltipContent = Boolean(title || subtitle || description || badge);
  if (!hasTooltipContent) {
    return <>{children}</>;
  }

  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 hidden w-72 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 group-hover:block">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 text-left shadow-2xl ring-1 ring-white/5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-zinc-50">{title}</div>
              {subtitle ? (
                <div className="mt-0.5 text-xs font-medium text-zinc-400">{subtitle}</div>
              ) : null}
            </div>
            {badge}
          </div>
          {description ? (
            <p className="mt-2 whitespace-pre-line text-xs leading-5 text-zinc-300">{description}</p>
          ) : null}
        </div>
        <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-zinc-800 bg-zinc-950/95" />
      </div>
    </div>
  );
}