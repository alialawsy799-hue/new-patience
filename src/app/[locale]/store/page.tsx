import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDown, Package } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { StoreClosed } from '@/components/store/store-closed';
import { Reveal } from '@/components/reveal';
import { ButtonLink } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { EmptyState, SectionHeading } from '@/components/ui/states';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { isProductSort, listCategories, listProducts } from '@/lib/store/catalog';
import { storePath } from '@/components/store/product-utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.store.metaTitle,
    description: dict.store.metaDescription,
    alternates: { canonical: `/${locale}/store`, languages: { ar: '/ar/store', en: '/en/store' } },
    openGraph: { title: dict.store.metaTitle, description: dict.store.metaDescription, url: `/${locale}/store` },
  };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  if (!settings.store.enabled) {
    return <StoreClosed locale={locale} />;
  }

  const query = await searchParams;
  const categorySlug = query.category?.trim() || undefined;
  const sort = isProductSort(query.sort) ? query.sort : 'catalog';

  const [categories, catalogue] = await Promise.all([
    listCategories(),
    listProducts({ categorySlug, sort }),
  ]);

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  const groups = categories
    .map((category) => ({
      category,
      products: catalogue.filter((product) => product.categorySlug === category.slug),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(50rem 28rem at 85% 0%, rgb(254 107 5 / 0.14), transparent 60%)',
          }}
        />
        <Container className="relative py-20 sm:py-28">
          <Reveal className="max-w-2xl">
            <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dict.store.heroEyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              {dict.store.heroTitle}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
              {dict.store.heroSubtitle}
            </p>
            <ButtonLink href="#catalogue" className="mt-8" icon={<ArrowDown className="size-4" aria-hidden />}>
              {dict.store.heroCta}
            </ButtonLink>
          </Reveal>
        </Container>
      </section>

      <Section id="catalogue" className="scroll-mt-24">
        <Container>
          <SectionHeading
            eyebrow={dict.store.categories}
            title={
              activeCategory
                ? locale === 'ar'
                  ? activeCategory.nameAr
                  : activeCategory.nameEn
                : dict.store.allProducts
            }
            className="mb-8"
          />

          <div className="mb-12 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(locale, '/store') + '#catalogue'}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                !categorySlug
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {dict.common.all}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={storePath(locale, category.slug)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  category.slug === categorySlug
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {locale === 'ar' ? category.nameAr : category.nameEn}
              </Link>
            ))}
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={<Package className="size-6" aria-hidden />}
              title={dict.store.noProducts}
              description={dict.store.noProductsBody}
            />
          ) : (
            <div className="flex flex-col gap-16">
              {groups.map((group) => (
                <section key={group.category.id} id={group.category.slug}>
                  {!activeCategory ? (
                    <div className="mb-7">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        {dict.store.categories}
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {locale === 'ar' ? group.category.nameAr : group.category.nameEn}
                      </h2>
                      {group.category.descriptionAr || group.category.descriptionEn ? (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)]">
                          {locale === 'ar' ? group.category.descriptionAr : group.category.descriptionEn}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.products.map((product, index) => (
                      <li key={product.id}>
                        <ProductCard product={product} locale={locale} priority={index < 4} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <section className="border-t border-[var(--border)] bg-[var(--foreground)] py-20 text-[var(--background)]">
        <Container className="max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.store.promoTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--background)]/70">{dict.store.promoBody}</p>
        </Container>
      </section>
    </>
  );
}
