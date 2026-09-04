import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'outline' | 'dark';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  success: 'bg-[var(--success-muted)] text-[var(--success)]',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)]',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  outline: 'border border-[var(--border-strong)] text-[var(--foreground-muted)]',
  dark: 'bg-[var(--foreground)] text-[var(--background)]',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.09em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
