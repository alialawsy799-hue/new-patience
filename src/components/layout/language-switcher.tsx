'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { LOCALE_COOKIE, localeMeta, switchLocalePath, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  locale,
  label,
  className,
  variant = 'compact',
}: {
  locale: Locale;
  label: string;
  className?: string;
  variant?: 'compact' | 'full';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const next: Locale = locale === 'ar' ? 'en' : 'ar';

  function switchTo() {
    // Cookie first so the middleware and the server layout agree immediately.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.push(switchLocalePath(pathname, next));
      router.refresh();
    });
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={switchTo}
        aria-label={label}
        disabled={pending}
        className={cn(
          'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium',
          'transition-colors hover:bg-[var(--surface-sunken)]',
          className,
        )}
      >
        <span className="flex items-center gap-3">
          <Languages className="size-4.5 text-[var(--foreground-subtle)]" aria-hidden />
          {localeMeta[locale].nativeLabel}
        </span>
        <span className="text-[var(--accent)]">{localeMeta[next].nativeLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={label}
      disabled={pending}
      className={cn(
        'grid h-9 min-w-9 place-items-center rounded-full px-3 text-[0.8125rem] font-bold',
        'text-[var(--foreground-muted)] transition-colors duration-200',
        'hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
        pending && 'opacity-50',
        className,
      )}
    >
      <span className="latin">{next === 'ar' ? 'ع' : 'EN'}</span>
    </button>
  );
}
