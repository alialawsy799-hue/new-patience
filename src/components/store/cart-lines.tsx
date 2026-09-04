'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  announceCartChange,
  cartErrorMessage,
  removeCartLine,
  setCartQuantity,
} from '@/components/store/cart-actions';
import { ProductImage, productPath } from '@/components/store/product-utils';
import { QuantityStepper } from '@/components/store/quantity-stepper';
import { getDictionary, type Locale } from '@/lib/i18n';
import type { CartLine, CartSummary } from '@/lib/store/cart';
import { MAX_QUANTITY_PER_ITEM } from '@/lib/store/constants';
import { cn, formatPrice } from '@/lib/utils';

export function CartLines({
  cart,
  locale,
  compact = false,
  onCart,
}: {
  cart: CartSummary;
  locale: Locale;
  compact?: boolean;
  onCart?: (next: CartSummary) => void;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = useCallback(
    (next: CartSummary) => {
      onCart?.(next);
      announceCartChange();
      router.refresh();
    },
    [onCart, router],
  );

  async function changeQuantity(line: CartLine, quantity: number) {
    setBusyId(line.itemId);
    setError(null);
    const result = await setCartQuantity(line.itemId, quantity);
    setBusyId(null);
    if (!result.ok) {
      setError(cartErrorMessage(result.error, dict));
      return;
    }
    apply(result.cart);
  }

  async function remove(line: CartLine) {
    setBusyId(line.itemId);
    setError(null);
    const result = await removeCartLine(line.itemId);
    setBusyId(null);
    if (!result.ok) {
      setError(cartErrorMessage(result.error, dict));
      return;
    }
    apply(result.cart);
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {cart.lines.map((line) => {
          const name = locale === 'ar' ? line.nameAr : line.nameEn;
          const max = Math.min(MAX_QUANTITY_PER_ITEM, Math.max(line.stock, line.quantity));
          return (
            <li
              key={line.itemId}
              className={cn('flex gap-4 py-4 first:pt-0 last:pb-0', busyId === line.itemId && 'opacity-70')}
            >
              <Link
                href={productPath(locale, line.slug)}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-sunken)]"
              >
                <ProductImage src={line.image} alt="" sizes="80px" className="p-2" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={productPath(locale, line.slug)}
                    className="text-sm font-semibold leading-snug hover:text-[var(--accent)]"
                  >
                    {name}
                  </Link>
                  <span className="latin tabular shrink-0 text-sm font-bold">
                    {formatPrice(line.lineTotalCents, line.currency, locale)}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <QuantityStepper
                    value={line.quantity}
                    max={max}
                    locale={locale}
                    compact={compact}
                    disabled={busyId === line.itemId}
                    onChange={(next) => void changeQuantity(line, next)}
                  />
                  <button
                    type="button"
                    onClick={() => void remove(line)}
                    disabled={busyId === line.itemId}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-subtle)] transition-colors hover:text-[var(--danger)]"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {dict.cart.remove}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
