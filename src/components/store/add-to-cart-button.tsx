'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, ShoppingBag } from 'lucide-react';
import { addCartItem, announceCartChange, cartErrorMessage } from '@/components/store/cart-actions';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function useAddToCart(locale: Locale) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const add = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      setPending(true);
      setError(null);

      const result = await addCartItem(productId, quantity);
      setPending(false);

      if (!result.ok) {
        setError(cartErrorMessage(result.error, dict));
        return false;
      }

      announceCartChange();
      router.refresh();

      setDone(true);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setDone(false), 2200);
      return true;
    },
    [dict, router],
  );

  return { add, pending, done, error, dict };
}

type AddToCartButtonProps = {
  productId: string;
  locale: Locale;
  stock: number;
  quantity?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  locale,
  stock,
  quantity = 1,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: AddToCartButtonProps) {
  const { add, pending, done, error, dict } = useAddToCart(locale);
  const soldOut = stock <= 0;

  const label = soldOut
    ? dict.store.outOfStock
    : pending
      ? dict.store.adding
      : done
        ? dict.store.added
        : dict.store.addToCart;

  return (
    <div className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={pending}
        disabled={soldOut}
        onClick={() => void add(productId, quantity)}
        icon={done ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
        className={cn(fullWidth && 'w-full')}
      >
        {label}
      </Button>

      <span className="sr-only" aria-live="polite">
        {done ? dict.store.added : ''}
      </span>

      {error ? (
        <p role="alert" className="text-[0.8125rem] font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BuyNowButton({
  productId,
  locale,
  stock,
  quantity = 1,
  className,
}: {
  productId: string;
  locale: Locale;
  stock: number;
  quantity?: number;
  className?: string;
}) {
  const { add, pending, error, dict } = useAddToCart(locale);
  const router = useRouter();
  const soldOut = stock <= 0;

  const handleClick = async () => {
    const added = await add(productId, quantity);
    if (added) router.push(localePath(locale, '/store/checkout'));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        type="button"
        variant="contrast"
        loading={pending}
        disabled={soldOut}
        onClick={() => void handleClick()}
        icon={<CreditCard className="size-4" aria-hidden />}
        className="w-full"
      >
        {dict.store.buyNow}
      </Button>

      {error ? (
        <p role="alert" className="text-[0.8125rem] font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
