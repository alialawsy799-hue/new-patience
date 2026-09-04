'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Eye } from 'lucide-react';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import {
  Availability,
  PriceTag,
  ProductImage,
  discountPercent,
  localized,
  productPath,
} from '@/components/store/product-utils';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { getDictionary, interpolate, type Locale } from '@/lib/i18n';
import type { ProductCardData } from '@/lib/store/catalog';
import { cn } from '@/lib/utils';

const CARD_IMAGE_SIZES = '(min-width: 1280px) 22rem, (min-width: 768px) 33vw, (min-width: 640px) 45vw, 90vw';

export function ProductCard({
  product,
  locale,
  priority = false,
}: {
  product: ProductCardData;
  locale: Locale;
  priority?: boolean;
}) {
  const dict = getDictionary(locale);
  const [quickView, setQuickView] = useState(false);

  const name = localized(locale, product.nameAr, product.nameEn);
  const altName = locale === 'ar' ? product.nameEn : product.nameAr;
  const summary = localized(locale, product.shortDescriptionAr, product.shortDescriptionEn);
  const categoryName = localized(locale, product.categoryNameAr, product.categoryNameEn);
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const href = productPath(locale, product.slug);
  const soldOut = product.stock <= 0 && !product.comingSoon;

  return (
    <>
      <article
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl',
          'border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]',
          'transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-quint)]',
          'hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lifted)]',
          'focus-within:-translate-y-1 focus-within:shadow-[var(--shadow-lifted)]',
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 block">
            <ProductImage
              src={product.images[0]}
              alt=""
              sizes={CARD_IMAGE_SIZES}
              priority={priority}
              className={cn(
                'p-5 transition-transform duration-300 ease-[var(--ease-out-quint)]',
                'group-hover:scale-[1.04]',
                product.comingSoon && 'opacity-70',
              )}
            />
          </Link>

          {product.comingSoon ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35">
              <span className="latin rounded-full bg-[var(--foreground)] px-5 py-2 text-[0.8125rem] font-extrabold tracking-[0.22em] text-[var(--background)]">
                {dict.store.soon}
              </span>
            </div>
          ) : null}

          <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {discount > 0 && !product.comingSoon ? (
              <Badge tone="dark">{interpolate(dict.store.save, { percent: discount })}</Badge>
            ) : null}
            {product.isNew && !product.comingSoon ? <Badge tone="accent">{dict.store.newArrivals}</Badge> : null}
          </div>

          {soldOut ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45">
              <span className="rounded-full bg-[var(--danger)] px-4 py-2 text-[0.8125rem] font-extrabold text-white">
                {dict.store.outOfStock}
              </span>
            </div>
          ) : null}

          {!product.comingSoon ? (
            <div className="absolute bottom-3 start-3 end-3 hidden sm:block">
              <button
                type="button"
                onClick={() => setQuickView(true)}
                className={cn(
                  buttonClasses('contrast', 'md'),
                  'w-full translate-y-2 opacity-0',
                  'transition-[opacity,transform] duration-300 ease-[var(--ease-out-quint)]',
                  'group-hover:translate-y-0 group-hover:opacity-100',
                  'group-focus-within:translate-y-0 group-focus-within:opacity-100',
                )}
              >
                <Eye className="size-4" aria-hidden />
                {dict.store.quickView}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          {categoryName ? (
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
              {categoryName}
            </span>
          ) : null}

          <h3 className="text-[0.9375rem] font-bold leading-snug tracking-tight">
            <Link
              href={href}
              className="rounded-sm transition-colors duration-200 hover:text-[var(--accent)]"
            >
              {name}
            </Link>
          </h3>
          {altName ? (
            <p className="latin line-clamp-1 text-[0.75rem] text-[var(--foreground-subtle)]" dir="ltr">
              {altName}
            </p>
          ) : null}

          {summary ? (
            <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-[var(--foreground-muted)]">
              {summary}
            </p>
          ) : null}

          <PriceTag
            priceCents={product.priceCents}
            compareAtPriceCents={product.comingSoon ? null : product.compareAtPriceCents}
            currency={product.currency}
            locale={locale}
            className="mt-auto pt-2"
          />

          {product.comingSoon ? (
            <p className="latin text-center text-[0.75rem] font-extrabold tracking-[0.18em] text-[var(--accent)]">
              {dict.store.soon}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <AddToCartButton
                productId={product.id}
                locale={locale}
                stock={product.stock}
                variant="primary"
                size="md"
                className="flex-1"
                fullWidth
              />

              <button
                type="button"
                onClick={() => setQuickView(true)}
                aria-label={dict.store.quickView}
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-full sm:hidden',
                  'border border-[var(--border-strong)] text-[var(--foreground-muted)]',
                  'transition-colors duration-200 hover:text-[var(--accent)]',
                )}
              >
                <Eye className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </article>

      <Modal
        open={quickView}
        onClose={() => setQuickView(false)}
        title={name}
        closeLabel={dict.common.close}
      >
        <div className="flex flex-col gap-5">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
            <ProductImage
              src={product.images[0]}
              alt={name}
              sizes="(min-width: 640px) 32rem, 90vw"
              className="p-8"
            />
          </div>

          <p className="latin text-sm text-[var(--foreground-subtle)]" dir="ltr">
            {altName}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <PriceTag
              priceCents={product.priceCents}
              compareAtPriceCents={product.compareAtPriceCents}
              currency={product.currency}
              locale={locale}
            />
            {product.comingSoon ? (
              <Badge tone="accent">{dict.store.soon}</Badge>
            ) : (
              <Availability stock={product.stock} locale={locale} />
            )}
          </div>

          {summary ? (
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{summary}</p>
          ) : null}

          {product.comingSoon ? (
            <p className="text-sm font-semibold text-[var(--accent)]">{dict.store.soonBody}</p>
          ) : (
            <AddToCartButton
              productId={product.id}
              locale={locale}
              stock={product.stock}
              size="lg"
              fullWidth
            />
          )}

          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-80"
          >
            {dict.store.details}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      </Modal>
    </>
  );
}
