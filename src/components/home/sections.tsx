import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  KeyRound,
  LayoutList,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { ButtonLink } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/states';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { cn, formatPrice } from '@/lib/utils';

export function WhyPatience({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const items = [
    { Icon: LayoutList, title: dict.home.whyItems.structuredTitle, body: dict.home.whyItems.structuredBody },
    { Icon: Sparkles, title: dict.home.whyItems.contentTitle, body: dict.home.whyItems.contentBody },
    { Icon: TrendingUp, title: dict.home.whyItems.progressTitle, body: dict.home.whyItems.progressBody },
    { Icon: BookOpenCheck, title: dict.home.whyItems.organizedTitle, body: dict.home.whyItems.organizedBody },
    { Icon: Users, title: dict.home.whyItems.studentTitle, body: dict.home.whyItems.studentBody },
    { Icon: ShieldCheck, title: dict.home.whyItems.secureTitle, body: dict.home.whyItems.secureBody },
  ];

  return (
    <Section className="border-b border-[var(--border)] bg-[var(--background-muted)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={dict.home.whyTitle}
            title={dict.home.whySubtitle}
            className="mb-14"
          />
        </Reveal>

        <ul className="grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, title, body }, index) => (
            <li key={title} className="bg-[var(--surface)]">
              <Reveal delay={index * 60} className="flex h-full flex-col gap-4 p-8">
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function HowItWorks({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const steps = [
    { Icon: KeyRound, title: dict.home.howSteps.oneTitle, body: dict.home.howSteps.oneBody },
    { Icon: ShieldCheck, title: dict.home.howSteps.twoTitle, body: dict.home.howSteps.twoBody },
    { Icon: BookOpenCheck, title: dict.home.howSteps.threeTitle, body: dict.home.howSteps.threeBody },
  ];

  return (
    <Section className="border-b border-[var(--border)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={dict.home.howTitle}
            title={dict.home.howSubtitle}
            align="center"
            className="mb-16"
          />
        </Reveal>

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Connecting rule between the three steps on wide screens. */}
          <div
            aria-hidden
            className="absolute inset-x-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent md:block"
          />
          {steps.map(({ Icon, title, body }, index) => (
            <li key={title} className="relative">
              <Reveal delay={index * 110} className="flex flex-col items-center text-center">
                <span className="relative grid size-14 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-subtle)]">
                  <Icon className="size-6" aria-hidden />
                  <span className="latin tabular absolute -end-2 -top-2 grid size-6 place-items-center rounded-full bg-[var(--accent)] text-[0.6875rem] font-bold text-[var(--accent-foreground)]">
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {body}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export type StorePreviewProduct = {
  slug: string;
  name: string;
  image: string | null;
  priceCents: number;
  currency: string;
};

export function StorePreview({
  locale,
  products,
  closed = false,
}: {
  locale: Locale;
  products: StorePreviewProduct[];
  closed?: boolean;
}) {
  const dict = getDictionary(locale);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  if (!closed && products.length === 0) return null;

  return (
    <Section className="border-b border-[var(--border)] bg-[var(--background-muted)]">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={dict.home.storeTitle}
            title={dict.home.storeSubtitle}
            className="mb-12"
            action={
              <ButtonLink
                href={localePath(locale, '/store')}
                variant="secondary"
                icon={<Arrow className="size-4" aria-hidden />}
              >
                {dict.home.storeCta}
              </ButtonLink>
            }
          />
        </Reveal>

        {closed ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center shadow-[var(--shadow-card)]">
            <p className="latin text-6xl font-extrabold tracking-tight text-[var(--accent)] sm:text-7xl">
              {dict.store.soon}
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
              {dict.store.closedBody}
            </p>
          </div>
        ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.slug}>
              <Reveal delay={index * 70}>
                <Link
                  href={localePath(locale, `/store/product/${product.slug}`)}
                  className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-white">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-5 transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5 p-5">
                    <h3 className="line-clamp-1 text-[0.9375rem] font-bold tracking-tight">
                      {product.name}
                    </h3>
                    <p className="latin tabular text-sm font-semibold text-[var(--accent)]">
                      {formatPrice(product.priceCents, product.currency, locale)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        )}
      </Container>
    </Section>
  );
}

export function FinalCta({ locale, className }: { locale: Locale; className?: string }) {
  const dict = getDictionary(locale);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <Section className={cn('relative overflow-hidden bg-[#08080a]', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(48rem 26rem at 50% 120%, rgb(254 107 5 / 0.28), transparent 62%)',
        }}
      />
      <Container className="relative">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] rtl:leading-[1.3]">
            {dict.home.finalTitle}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            {dict.home.finalBody}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href={localePath(locale, '/courses')}
              size="lg"
              icon={<Arrow className="size-4.5" aria-hidden />}
            >
              {dict.home.finalPrimaryCta}
            </ButtonLink>
            <ButtonLink
              href={localePath(locale, '/contact')}
              size="lg"
              variant="secondary"
              className="border-white/25 text-white hover:border-white hover:text-white"
            >
              {dict.home.finalSecondaryCta}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
