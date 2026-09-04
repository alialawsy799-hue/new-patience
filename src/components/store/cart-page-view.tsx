'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { CartLines } from '@/components/store/cart-lines';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import type { CartSummary } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils';

export function CartPageView({
  locale,
  initialCart,
}: {
  locale: Locale;
  initialCart: CartSummary;
}) {
  const dict = getDictionary(locale);
  const [cart, setCart] = useState(initialCart);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" aria-hidden />}
        title={dict.cart.empty}
        description={dict.cart.emptyBody}
        action={<ButtonLink href={localePath(locale, '/store')}>{dict.cart.emptyCta}</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr]">
      <CartLines cart={cart} locale={locale} onCart={setCart} />
      <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold">{dict.checkout.summarySection}</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--foreground-muted)]">{dict.cart.subtotal}</dt>
            <dd className="latin tabular font-semibold">
              {formatPrice(cart.subtotalCents, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--foreground-muted)]">{dict.cart.shipping}</dt>
            <dd className="text-[var(--foreground-subtle)]">{dict.cart.shippingAtCheckout}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base">
            <dt className="font-bold">{dict.cart.total}</dt>
            <dd className="latin tabular font-bold">
              {formatPrice(cart.subtotalCents, cart.currency, locale)}
            </dd>
          </div>
        </dl>
        <ButtonLink href={localePath(locale, '/store/checkout')} size="lg" className="mt-6 w-full">
          {dict.cart.checkout}
        </ButtonLink>
        <ButtonLink
          href={localePath(locale, '/store')}
          variant="ghost"
          className="mt-2 w-full"
        >
          {dict.cart.continueShopping}
        </ButtonLink>
      </aside>
    </div>
  );
}
