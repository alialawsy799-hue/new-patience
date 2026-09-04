import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertTone = 'info' | 'success' | 'danger' | 'warning';

const alertTones: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  info: { className: 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)]', Icon: Info },
  success: { className: 'bg-[var(--success-muted)] text-[var(--success)]', Icon: CheckCircle2 },
  danger: { className: 'bg-[var(--danger-muted)] text-[var(--danger)]', Icon: XCircle },
  warning: { className: 'bg-[var(--warning-muted)] text-[var(--warning)]', Icon: AlertTriangle },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { className: toneClass, Icon } = alertTones[tone];

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl p-4 text-sm', toneClass, className)}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="grid size-14 place-items-center rounded-2xl bg-[var(--surface-sunken)] text-[var(--foreground-subtle)]">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-md flex-col gap-2">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Editorial section heading used across the marketing pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  className,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('flex max-w-2xl flex-col gap-3', align === 'center' && 'items-center')}>
        {eyebrow ? (
          <span
            className={cn(
              'rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]',
              align === 'center' && '[&::after]:mx-auto',
            )}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {description ? (
          <p className="text-base leading-relaxed text-[var(--foreground-muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
