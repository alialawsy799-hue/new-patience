import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';
import { cn, formatNumber, formatPrice } from '@/lib/utils';

/** Below this the shelf count is shown instead of a plain "in stock". */
export const LOW_STOCK_THRESHOLD = 5;

export function localized(
  locale: Locale,
  arabic: string | null | undefined,
  english: string | null | undefined,
): string {
  return ((locale === 'ar' ? arabic : english) ?? '').trim();
}

export function discountPercent(
  priceCents: number,
  compareAtPriceCents?: number | null,
): number {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return 0;
  return Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
}

export function productPath(locale: Locale, slug: string): string {
  return localePath(locale, `/store/product/${slug}`);
}

export function storePath(locale: Locale, categorySlug?: string | null): string {
  const base = localePath(locale, '/store');
  return categorySlug ? `${base}?category=${encodeURIComponent(categorySlug)}#catalogue` : base;
}

/**
 * Store photos are local JPEGs/PNGs (and a few SVGs for PATIENCE merch).
 * SVGs skip the optimiser; photographs go through next/image.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className="grid size-full place-items-center bg-white text-[var(--foreground-subtle)]"
        aria-hidden
      >
        <ImageOff className="size-6" />
      </div>
    );
  }

  const unoptimized = src.endsWith('.svg') || src.startsWith('http') || src.startsWith('/uploads/');

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={unoptimized}
      sizes={sizes}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}

export function PriceTag({
  priceCents,
  compareAtPriceCents,
  currency,
  locale,
  size = 'md',
  className,
}: {
  priceCents: number;
  compareAtPriceCents?: number | null;
  currency: string;
  locale: Locale;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dict = getDictionary(locale);
  const discount = discountPercent(priceCents, compareAtPriceCents);

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5', className)}>
      <span
        className={cn(
          'latin tabular font-bold tracking-tight',
          size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-lg',
        )}
      >
        {formatPrice(priceCents, currency, locale)}
      </span>

      {discount > 0 && compareAtPriceCents ? (
        <>
          <s
            className={cn(
              'latin tabular text-[var(--foreground-subtle)]',
              size === 'lg' ? 'text-base' : 'text-[0.8125rem]',
            )}
          >
            <span className="sr-only">{dict.store.was} </span>
            {formatPrice(compareAtPriceCents, currency, locale)}
          </s>
          <Badge tone="accent">{interpolate(dict.store.save, { percent: discount })}</Badge>
        </>
      ) : null}
    </div>
  );
}

export function Availability({
  stock,
  locale,
  className,
}: {
  stock: number;
  locale: Locale;
  className?: string;
}) {
  const dict = getDictionary(locale);

  if (stock <= 0) {
    return (
      <Badge tone="danger" className={className}>
        {dict.store.outOfStock}
      </Badge>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge tone="warning" className={className}>
        {interpolate(dict.store.lowStock, { count: formatNumber(stock, locale) })}
      </Badge>
    );
  }

  return (
    <Badge tone="success" className={className}>
      {dict.store.inStock}
    </Badge>
  );
}
