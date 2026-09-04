import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductCard } from '@/components/store/product-card';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductPurchase } from '@/components/store/product-purchase';
import { Availability, PriceTag, localized } from '@/components/store/product-utils';
import { Reveal } from '@/components/reveal';
import { Badge } from '@/components/ui/badge';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, interpolate, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { getProductBySlug, getRelatedProducts } from '@/lib/store/catalog';
import { discountPercent } from '@/components/store/product-utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = locale === 'ar' ? product.nameAr : product.nameEn;
  const description = locale === 'ar' ? product.shortDescriptionAr : product.shortDescriptionEn;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/store/product/${slug}`,
      languages: {
        ar: `/ar/store/product/${slug}`,
        en: `/en/store/product/${slug}`,
      },
    },
    openGraph: { title, description, url: `/${locale}/store/product/${slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const settings = await getSiteSettings();
  if (!settings.store.enabled) redirect(localePath(locale, '/store'));

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const dict = getDictionary(locale);
  const name = localized(locale, product.nameAr, product.nameEn);
  const description = localized(locale, product.descriptionAr, product.descriptionEn);
  const category = localized(locale, product.categoryNameAr, product.categoryNameEn);
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const related = await getRelatedProducts(product, 4);

  return (
    <Section className="pt-12 sm:pt-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ProductGallery images={product.images} name={name} />
          </Reveal>

          <Reveal delay={80} className="flex flex-col gap-6">
            {category ? (
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
                {category}
              </span>
            ) : null}
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
            <p className="latin text-base text-[var(--foreground-subtle)]" dir="ltr">
              {locale === 'ar' ? product.nameEn : product.nameAr}
            </p>
            {product.comingSoon ? (
              <Badge tone="accent">{dict.store.soon}</Badge>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <PriceTag
                priceCents={product.priceCents}
                compareAtPriceCents={product.compareAtPriceCents}
                currency={product.currency}
                locale={locale}
                size="lg"
              />
              {discount > 0 && !product.comingSoon ? (
                <Badge tone="accent">{interpolate(dict.store.save, { percent: discount })}</Badge>
              ) : null}
              {product.comingSoon ? null : <Availability stock={product.stock} locale={locale} />}
            </div>

            {product.shortDescriptionAr || product.shortDescriptionEn ? (
              <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
                {localized(locale, product.shortDescriptionAr, product.shortDescriptionEn)}
              </p>
            ) : null}

            <ProductPurchase
              productId={product.id}
              stock={product.stock}
              locale={locale}
              comingSoon={product.comingSoon}
            />

            {description ? (
              <div className="border-t border-[var(--border)] pt-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                  {dict.store.description}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {description}
                </p>
              </div>
            ) : null}

            {product.specs.length > 0 ? (
              <dl className="grid gap-3 border-t border-[var(--border)] pt-6">
                <dt className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                  {dict.store.details}
                </dt>
                {product.specs.map((spec) => (
                  <div key={spec.labelEn} className="flex justify-between gap-4 text-sm">
                    <dt className="text-[var(--foreground-muted)]">
                      {locale === 'ar' ? spec.labelAr : spec.labelEn}
                    </dt>
                    <dd className="font-semibold">{locale === 'ar' ? spec.valueAr : spec.valueEn}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </Reveal>
        </div>

        {related.length > 0 ? (
          <div className="mt-24">
            <h2 className="mb-8 text-2xl font-extrabold tracking-tight">{dict.store.relatedProducts}</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
