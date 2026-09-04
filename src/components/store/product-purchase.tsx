'use client';

import { useState } from 'react';
import { AddToCartButton, BuyNowButton } from '@/components/store/add-to-cart-button';
import { QuantityStepper } from '@/components/store/quantity-stepper';
import { getDictionary, type Locale } from '@/lib/i18n';

export function ProductPurchase({
  productId,
  stock,
  locale,
  comingSoon = false,
}: {
  productId: string;
  stock: number;
  locale: Locale;
  comingSoon?: boolean;
}) {
  const dict = getDictionary(locale);
  const [quantity, setQuantity] = useState(1);
  const max = Math.max(1, stock);

  if (comingSoon) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] p-5">
        <p className="latin text-sm font-extrabold tracking-[0.22em] text-[var(--accent)]">{dict.store.soon}</p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{dict.store.soonBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">{dict.store.quantity}</span>
        <QuantityStepper
          value={quantity}
          max={max}
          locale={locale}
          disabled={stock <= 0}
          onChange={setQuantity}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AddToCartButton
          productId={productId}
          locale={locale}
          stock={stock}
          quantity={quantity}
          size="lg"
          fullWidth
        />
        <BuyNowButton productId={productId} locale={locale} stock={stock} quantity={quantity} />
      </div>
    </div>
  );
}
