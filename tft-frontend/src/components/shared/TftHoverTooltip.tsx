import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const hasTooltipContent = Boolean(title || subtitle || description || badge);

  const updatePosition = useCallback((event?: MouseEvent<HTMLSpanElement>) => {
    const target = event?.currentTarget;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const hoverX = typeof event?.clientX === 'number' ? event.clientX : rect.left + rect.width / 2;

    setPosition({
      x: Math.min(window.innerWidth - 16, Math.max(16, hoverX)),
      y: rect.top - 12,
    });
  }, []);

  const tooltipNode = useMemo(() => {
    if (!visible || !hasTooltipContent || typeof document === 'undefined') return null;

    return createPortal(
      <div
        className="pointer-events-none fixed z-50 w-72 max-w-[min(20rem,calc(100vw-2rem))]"
        style={{ left: position.x, top: position.y, transform: 'translate(-50%, -100%)' }}
      >
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
      </div>,
      document.body,
    );
  }, [badge, description, hasTooltipContent, position.x, position.y, subtitle, title, visible]);

  useEffect(() => {
    if (!visible) return;

    const onScroll = () => setVisible(false);
    const onResize = () => setVisible(false);

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [visible]);

  if (!showTooltip) {
    return <>{children}</>;
  }

  if (!hasTooltipContent) {
    return <>{children}</>;
  }

  return (
    <span
      className="inline-flex"
      onMouseEnter={(event) => {
        updatePosition(event);
        setVisible(true);
      }}
      onMouseMove={(event) => {
        if (!visible) return;
        updatePosition(event);
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {tooltipNode}
    </span>
  );
}