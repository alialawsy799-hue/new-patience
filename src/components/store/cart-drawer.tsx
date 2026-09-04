'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { CART_CHANGED_EVENT, CART_OPEN_EVENT, fetchCart } from '@/components/store/cart-actions';
import { CartLines } from '@/components/store/cart-lines';
import { ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/states';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import type { CartSummary } from '@/lib/store/cart';
import { formatNumber, formatPrice } from '@/lib/utils';

export function CartDrawer({
  locale,
  initialCart,
}: {
  locale: Locale;
  initialCart: CartSummary;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(initialCart);

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    async function onChanged() {
      const next = await fetchCart();
      if (next) setCart(next);
    }
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    window.addEventListener(CART_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(CART_OPEN_EVENT, onOpen);
      window.removeEventListener(CART_CHANGED_EVENT, onChanged);
    };
  }, []);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={dict.cart.title}
      closeLabel={dict.common.close}
      layout="side"
      className="h-full max-h-none sm:max-w-md"
    >
      {cart.lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" aria-hidden />}
          title={dict.cart.empty}
          description={dict.cart.emptyBody}
          action={
            <ButtonLink
              href={localePath(locale, '/store')}
              onClick={() => setOpen(false)}
            >
              {dict.cart.emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <CartLines cart={cart} locale={locale} compact onCart={setCart} />

          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">
                {formatNumber(cart.itemCount, locale)} {cart.itemCount === 1 ? dict.cart.item : dict.cart.items}
              </span>
              <span className="text-[var(--foreground-subtle)]">{dict.cart.shippingAtCheckout}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{dict.cart.subtotal}</span>
              <span className="latin tabular text-lg font-bold">
                {formatPrice(cart.subtotalCents, cart.currency, locale)}
              </span>
            </div>
            <ButtonLink
              href={localePath(locale, '/store/checkout')}
              size="lg"
              className="w-full"
              onClick={() => {
                setOpen(false);
                router.refresh();
              }}
            >
              {dict.cart.checkout}
            </ButtonLink>
            <ButtonLink
              href={localePath(locale, '/store/cart')}
              variant="secondary"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              {dict.cart.title}
            </ButtonLink>
          </div>
        </div>
      )}
    </Modal>
  );
}
