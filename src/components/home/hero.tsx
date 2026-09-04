import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import { PatienceMark } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';

type HeroProps = {
  locale: Locale;
  stageCount: number;
  lessonCount: number;
  /** Optional overrides configured by the administrator in Site Settings. */
  headline?: string;
  subheadline?: string;
};

export function Hero({ locale, stageCount, lessonCount, headline, subheadline }: HeroProps) {
  const dict = getDictionary(locale);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const title = headline?.trim() || dict.home.heroTitle;
  const subtitle = subheadline?.trim() || dict.home.heroSubtitle;

  const stats = [
    { value: formatNumber(stageCount, locale), label: dict.home.heroStatStages },
    { value: `${formatNumber(lessonCount, locale)}+`, label: dict.home.heroStatLessons },
    { value: '∞', label: dict.home.heroStatAccess },
  ];

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
      {/* Ambient brand wash — a single soft orange bloom, no busy gradients. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60rem 32rem at 78% -10%, rgb(254 107 5 / 0.16), transparent 60%)',
        }}
      />
      {/* Oversized lamp mark, bled off the edge as an editorial device. */}
      <PatienceMark
        aria-hidden
        className="pointer-events-none absolute -top-16 end-[-6rem] hidden h-[34rem] w-[34rem] text-[var(--foreground)] opacity-[0.035] lg:block"
      />

      <Container className="relative pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
        <div className="max-w-3xl">
          <p className="animate-[reveal_0.6s_var(--ease-out-quint)_both] text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
            {dict.home.heroEyebrow}
          </p>

          <h1 className="mt-6 animate-[reveal_0.7s_var(--ease-out-quint)_0.08s_both] text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-[4.25rem] rtl:leading-[1.28] rtl:tracking-normal">
            {title.split('\n').map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-2xl animate-[reveal_0.7s_var(--ease-out-quint)_0.16s_both] text-lg leading-relaxed text-[var(--foreground-muted)] sm:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 flex animate-[reveal_0.7s_var(--ease-out-quint)_0.24s_both] flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink
              href={localePath(locale, '/courses')}
              size="lg"
              icon={<Arrow className="size-4.5" aria-hidden />}
            >
              {dict.home.heroPrimaryCta}
            </ButtonLink>
            <ButtonLink
              href={localePath(locale, '/student')}
              size="lg"
              variant="secondary"
              icon={<KeyRound className="size-4.5" aria-hidden />}
            >
              {dict.home.heroSecondaryCta}
            </ButtonLink>
          </div>
        </div>

        <dl className="mt-16 grid animate-[reveal_0.7s_var(--ease-out-quint)_0.32s_both] grid-cols-3 gap-6 border-t border-[var(--border)] pt-8 sm:mt-20 sm:max-w-2xl sm:gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="order-2 text-[0.8125rem] leading-snug text-[var(--foreground-subtle)]">
                {stat.label}
              </dt>
              <dd className="latin tabular order-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
