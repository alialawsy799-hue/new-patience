'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { PatienceLogo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { localePath, type Locale } from '@/lib/i18n/config';
import type { NavLink } from '@/components/layout/nav-links';
import { cn } from '@/lib/utils';

type MobileNavProps = {
  locale: Locale;
  links: NavLink[];
  labels: {
    open: string;
    close: string;
    language: string;
    theme: string;
    cta: string;
    ctaHref: string;
    signedInAs?: string;
  };
};

export function MobileNav({ locale, links, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  // Any navigation closes the sheet, including browser back/forward.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-sunken)] xl:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div
        className={cn(
          'fixed inset-0 z-90 xl:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-[var(--overlay)] backdrop-blur-[3px] transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />

        <div
          role="dialog"
          aria-modal={open || undefined}
          aria-label={labels.open}
          className={cn(
            'absolute inset-y-0 end-0 flex w-[min(22rem,88vw)] flex-col bg-[var(--surface)] shadow-[var(--shadow-lifted)]',
            'transition-transform duration-400 ease-[var(--ease-out-quint)]',
            open ? 'translate-x-0' : 'rtl:-translate-x-full ltr:translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
            <PatienceLogo size="sm" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="grid size-9 place-items-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <X className="size-4.5" aria-hidden />
            </button>
          </div>

          <nav className="scrollbar-slim flex-1 overflow-y-auto p-3" aria-label={labels.open}>
            <ul className="flex flex-col gap-1">
              {links.map((link, index) => {
                const href = localePath(locale, link.href);
                const active = pathname === href || (link.href !== '/' && pathname.startsWith(href));
                return (
                  <li key={link.href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors',
                        active
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                          : 'text-[var(--foreground)] hover:bg-[var(--surface-sunken)]',
                      )}
                      style={open ? { animation: `slide-up 0.35s var(--ease-out-quint) ${index * 45}ms both` } : undefined}
                    >
                      {link.label}
                      <Arrow className="size-4 opacity-40" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-1 border-t border-[var(--border)] p-3">
            <LanguageSwitcher locale={locale} label={labels.language} variant="full" />
            <div className="flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium">
              <span>{labels.theme}</span>
              <ThemeToggle label={labels.theme} />
            </div>
            <Link
              href={labels.ctaHref}
              className="mt-2 flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)]"
            >
              {labels.cta}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
