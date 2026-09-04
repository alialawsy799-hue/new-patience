import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, interpolate, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { getOrderByNumber } from '@/lib/store/orders';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).checkout.successTitle, robots: { index: false, follow: false } };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  if (!settings.store.enabled) redirect(localePath(locale, '/store'));

  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  return (
    <Section className="pt-16 sm:pt-24">
      <Container className="max-w-xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--success-muted)] text-[var(--success)]">
          <CheckCircle2 className="size-8" aria-hidden />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{dict.checkout.successTitle}</h1>
        <p className="mt-4 text-[var(--foreground-muted)]">
          {interpolate(dict.checkout.successBody, {
            number: order?.orderNumber ?? orderNumber ?? '—',
          })}
        </p>
        {order ? (
          <p className="latin mt-2 text-sm font-semibold text-[var(--accent)]">
            {dict.checkout.orderNumber}: {order.orderNumber}
          </p>
        ) : null}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href={localePath(locale, '/store')}>{dict.cart.continueShopping}</ButtonLink>
          <ButtonLink href={localePath(locale, '/')} variant="secondary">
            {dict.nav.home}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
