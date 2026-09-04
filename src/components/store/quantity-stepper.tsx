'use client';

import { Minus, Plus } from 'lucide-react';
import { getDictionary, type Locale } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  locale,
  disabled = false,
  compact = false,
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  locale: Locale;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const dict = getDictionary(locale);
  const ceiling = Math.max(min, max);
  const decreased = Math.max(min, value - 1);
  const increased = Math.min(ceiling, value + 1);

  const buttonClass = cn(
    'grid shrink-0 place-items-center text-[var(--foreground-muted)]',
    'transition-colors duration-200 ease-[var(--ease-out-quint)]',
    'hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
    'disabled:pointer-events-none disabled:opacity-40',
    compact ? 'size-9' : 'size-11',
  );

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface)]',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(decreased)}
        disabled={disabled || value <= min}
        aria-label={`${dict.cart.updateQuantity}: ${formatNumber(decreased, locale)}`}
        className={buttonClass}
      >
        <Minus className="size-4" aria-hidden />
      </button>

      <span
        aria-live="polite"
        className={cn(
          'latin tabular select-none text-center text-sm font-semibold',
          compact ? 'w-8' : 'w-10',
        )}
      >
        <span className="sr-only">{dict.store.quantity}: </span>
        {formatNumber(value, locale)}
      </span>

      <button
        type="button"
        onClick={() => onChange(increased)}
        disabled={disabled || value >= ceiling}
        aria-label={`${dict.cart.updateQuantity}: ${formatNumber(increased, locale)}`}
        className={buttonClass}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
