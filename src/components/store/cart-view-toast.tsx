'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { CART_CHANGED_EVENT } from '@/components/store/cart-actions';
import { localePath, type Locale } from '@/lib/i18n';

export function CartViewToast({
  locale,
  label,
  count,
}: {
  locale: Locale;
  label: string;
  count: number;
}) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    function onChanged() {
      setPulse(true);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setPulse(false), 4000);
    }
    window.addEventListener(CART_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, onChanged);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (count <= 0 && !pulse) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Link
        href={localePath(locale, '/store/cart')}
        className="pointer-events-auto inline-flex items-center gap-2.5 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--accent-foreground)] shadow-[var(--shadow-glow)]"
      >
        <ShoppingBag className="size-4.5" aria-hidden />
        {label}
        {count > 0 ? (
          <span className="latin tabular grid min-w-5 place-items-center rounded-md bg-[var(--accent-foreground)] px-1.5 text-[0.6875rem] font-extrabold text-[var(--accent)]">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
