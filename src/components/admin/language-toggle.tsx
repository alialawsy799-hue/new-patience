'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALE_COOKIE, localeMeta, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

/** Admin URLs are not locale-prefixed, so only the cookie changes. */
export function AdminLanguageToggle({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => router.refresh());
      }}
      className={cn(
        'grid h-9 min-w-9 place-items-center rounded-full px-3 text-[0.8125rem] font-bold',
        'text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]',
        className,
      )}
    >
      <span className="latin">{localeMeta[next].nativeLabel === 'العربية' ? 'ع' : 'EN'}</span>
    </button>
  );
}
