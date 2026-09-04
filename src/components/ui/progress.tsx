import { cn } from '@/lib/utils';

type ProgressProps = {
  value: number;
  label?: string;
  /** Renders the percentage next to the label. */
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  /** Formats the number for the active locale (Arabic-Indic digits, etc.). */
  formatValue?: (value: number) => string;
};

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' } as const;

export function Progress({
  value,
  label,
  showValue = true,
  size = 'md',
  className,
  ariaLabel,
  formatValue,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const display = formatValue ? formatValue(clamped) : `${clamped}%`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-4">
          {label ? (
            <span className="text-sm font-semibold text-[var(--foreground-muted)]">{label}</span>
          ) : null}
          {showValue ? (
            <span className="latin tabular text-sm font-bold text-[var(--accent)]">{display}</span>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
        className={cn(
          'w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]',
          heights[size],
        )}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-[var(--ease-out-quint)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Circular variant used on the student dashboard summary card.
 * `pathLength={100}` lets the dash offset be expressed directly as a
 * percentage, independent of the radius.
 */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  children,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth / 2}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth / 2}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - clamped}
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-quint)]"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
