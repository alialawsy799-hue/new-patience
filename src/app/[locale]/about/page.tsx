import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/reveal';
import { Container, Section } from '@/components/ui/container';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.about.metaTitle,
    description: dict.about.body,
    alternates: { canonical: `/${locale}/about`, languages: { ar: '/ar/about', en: '/en/about' } },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const values = [
    { title: dict.about.values.passionTitle, body: dict.about.values.passionBody, tone: 'var(--color-passion-mid)' },
    { title: dict.about.values.calmTitle, body: dict.about.values.calmBody, tone: 'var(--color-calm-mid)' },
    { title: dict.about.values.elegantTitle, body: dict.about.values.elegantBody, tone: 'var(--color-elegant-mid)' },
  ];

  return (
    <Section className="pt-14 sm:pt-16">
      <Container>
        <Reveal className="max-w-3xl">
          <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            {dict.about.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{dict.about.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--foreground-muted)]">{dict.about.body}</p>
        </Reveal>

        <div className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">{dict.about.valuesTitle}</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((value, index) => (
              <li key={value.title}>
                <Reveal delay={index * 80} className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                  <span className="block h-1 w-10 rounded-full" style={{ background: value.tone }} />
                  <h3 className="mt-5 text-xl font-extrabold">{value.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{value.body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
