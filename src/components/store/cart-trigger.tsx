'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CartTrigger({
  count,
  label,
  href,
}: {
  count: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'relative inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-strong)]',
        'bg-[var(--surface)] px-3 text-[0.75rem] font-semibold',
        'text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]',
      )}
    >
      <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      {count > 0 ? (
        <span className="latin tabular grid min-w-4.5 place-items-center rounded-md bg-[var(--accent)] px-1 text-[0.625rem] font-bold leading-4 text-[var(--accent-foreground)]">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
