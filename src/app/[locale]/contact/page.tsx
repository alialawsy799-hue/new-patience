import type { Metadata } from 'next';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ContactForm } from '@/components/contact/contact-form';
import { Reveal } from '@/components/reveal';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';

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
    title: dict.contact.metaTitle,
    description: dict.contact.metaDescription,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { ar: '/ar/contact', en: '/en/contact' },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  const details = [
    {
      icon: Mail,
      label: dict.contact.emailLabel,
      value: settings.contact.email,
      href: settings.contact.email ? `mailto:${settings.contact.email}` : null,
    },
    {
      icon: Phone,
      label: dict.contact.phoneLabel,
      value: settings.contact.phone,
      href: settings.contact.phone ? `tel:${settings.contact.phone.replace(/\s/g, '')}` : null,
    },
    {
      icon: MapPin,
      label: dict.contact.addressLabel,
      value: locale === 'ar' ? settings.contact.addressAr : settings.contact.addressEn,
      href: null,
    },
    {
      icon: Clock,
      label: dict.contact.hoursLabel,
      value: locale === 'ar' ? settings.contact.hoursAr : settings.contact.hoursEn,
      href: null,
    },
  ].filter((item) => item.value.trim().length > 0);

  return (
    <Section className="pt-14 sm:pt-16">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dict.contact.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{dict.contact.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--foreground-muted)]">{dict.contact.subtitle}</p>

            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                {dict.contact.infoTitle}
              </h2>
              {details.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--foreground-muted)]">{dict.contact.notConfigured}</p>
              ) : (
                <ul className="mt-5 flex flex-col gap-4">
                  {details.map((item) => {
                    const Icon = item.icon;
                    const content = (
                      <>
                        <span className="grid size-10 place-items-center rounded-full bg-[var(--surface-sunken)] text-[var(--accent)]">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-sm font-medium">{item.value}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={item.label}>
                        {item.href ? (
                          <a href={item.href} className="flex items-start gap-3 hover:text-[var(--accent)]">
                            {content}
                          </a>
                        ) : (
                          <div className="flex items-start gap-3">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Reveal>

          <Reveal delay={80} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
            <ContactForm locale={locale} />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
