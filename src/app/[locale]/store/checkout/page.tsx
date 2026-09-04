import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/store/checkout-form';
import { Container, Section } from '@/components/ui/container';
import { getStudentSession } from '@/lib/auth/student';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { getCartSummary } from '@/lib/store/cart';
import { calculateShipping } from '@/lib/store/orders';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).checkout.title, robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  if (!settings.store.enabled) redirect(localePath(locale, '/store'));

  const [cart, student] = await Promise.all([
    getCartSummary(settings.store.currency),
    getStudentSession(),
  ]);

  if (cart.lines.length === 0) redirect(localePath(locale, '/store/cart'));

  const shipping = calculateShipping(cart.subtotalCents, settings.store);
  const total = cart.subtotalCents + shipping;

  return (
    <Section className="pt-12 sm:pt-16">
      <Container>
        <div className="mb-10 max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.checkout.title}</h1>
          <p className="mt-3 text-[var(--foreground-muted)]">{dict.checkout.subtitle}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <CheckoutForm locale={locale} defaultName={student?.name} />

          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold">{dict.checkout.summarySection}</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {cart.lines.map((line) => (
                <li key={line.itemId} className="flex justify-between gap-4">
                  <span className="text-[var(--foreground-muted)]">
                    {locale === 'ar' ? line.nameAr : line.nameEn} × {line.quantity}
                  </span>
                  <span className="latin tabular font-semibold">
                    {formatPrice(line.lineTotalCents, line.currency, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 flex flex-col gap-2 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--foreground-muted)]">{dict.cart.subtotal}</dt>
                <dd className="latin tabular">{formatPrice(cart.subtotalCents, cart.currency, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--foreground-muted)]">{dict.cart.shipping}</dt>
                <dd className="latin tabular">{formatPrice(shipping, cart.currency, locale)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base">
                <dt className="font-bold">{dict.cart.total}</dt>
                <dd className="latin tabular font-bold">{formatPrice(total, cart.currency, locale)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
