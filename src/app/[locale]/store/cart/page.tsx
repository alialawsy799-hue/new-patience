import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CartPageView } from '@/components/store/cart-page-view';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { getCartSummary } from '@/lib/store/cart';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).cart.title, robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  if (!settings.store.enabled) redirect(localePath(locale, '/store'));

  const cart = await getCartSummary(settings.store.currency);

  return (
    <Section className="pt-12 sm:pt-16">
      <Container>
        <h1 className="mb-10 text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.cart.title}</h1>
        <CartPageView locale={locale} initialCart={cart} />
      </Container>
    </Section>
  );
}
