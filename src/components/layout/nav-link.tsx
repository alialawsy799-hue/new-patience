'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const segments = href.split('/').filter(Boolean);
  const isHome = segments.length === 1;
  const active = isHome ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative px-1 py-1.5 text-sm font-medium transition-colors duration-200',
        active ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
      )}
    >
      {label}
      <span
        className={cn(
          'absolute inset-x-0 -bottom-0.5 h-0.5 origin-center rounded-full bg-[var(--accent)]',
          'transition-transform duration-300 ease-[var(--ease-out-quint)]',
          active ? 'scale-x-100' : 'scale-x-0',
        )}
        aria-hidden
      />
    </Link>
  );
}
