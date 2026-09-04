import { ArrowLeft, ArrowRight } from 'lucide-react';
import { and, desc, eq } from 'drizzle-orm';
import { Hero } from '@/components/home/hero';
import { FinalCta, HowItWorks, StorePreview, WhyPatience } from '@/components/home/sections';
import { StageCard } from '@/components/courses/stage-card';
import { Reveal } from '@/components/reveal';
import { ButtonLink } from '@/components/ui/button';
import { Container, Section } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/states';
import { getStudentSession } from '@/lib/auth/student';
import { db, ensureMigrated } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { listStageCards } from '@/lib/courses/queries';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const dict = getDictionary(locale);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  await ensureMigrated();
  const [student, settings] = await Promise.all([getStudentSession(), getSiteSettings()]);

  const [stages, previewProducts] = await Promise.all([
    listStageCards(student?.id ?? null),
    settings.store.enabled
      ? db
          .select({
            slug: products.slug,
            nameAr: products.nameAr,
            nameEn: products.nameEn,
            images: products.images,
            priceCents: products.priceCents,
            currency: products.currency,
          })
          .from(products)
          .where(and(eq(products.isActive, true), eq(products.isFeatured, true), eq(products.comingSoon, false)))
          .orderBy(desc(products.salesCount))
          .limit(4)
      : Promise.resolve([]),
  ]);

  const totalLessons = stages.reduce((sum, stage) => sum + stage.lessonCount, 0);

  return (
    <>
      <Hero
        locale={locale}
        stageCount={stages.length}
        lessonCount={totalLessons}
        headline={locale === 'ar' ? settings.hero.titleAr : settings.hero.titleEn}
        subheadline={locale === 'ar' ? settings.hero.subtitleAr : settings.hero.subtitleEn}
      />

      <Section className="border-b border-[var(--border)]">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={dict.home.featuredTitle}
              title={dict.home.featuredSubtitle}
              className="mb-12"
              action={
                <ButtonLink
                  href={localePath(locale, '/courses')}
                  variant="secondary"
                  icon={<Arrow className="size-4" aria-hidden />}
                >
                  {dict.home.featuredCta}
                </ButtonLink>
              }
            />
          </Reveal>

          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stages.slice(0, 3).map((stage, index) => (
              <li key={stage.id}>
                <Reveal delay={index * 90} className="h-full">
                  <StageCard
                    locale={locale}
                    index={index}
                    stage={{
                      id: stage.id,
                      slug: stage.slug,
                      number: stage.number,
                      title: locale === 'ar' ? stage.titleAr : stage.titleEn,
                      subtitle: locale === 'ar' ? stage.subtitleAr : stage.subtitleEn,
                      description: locale === 'ar' ? stage.descriptionAr : stage.descriptionEn,
                      accent: stage.accent,
                      lessonCount: stage.lessonCount,
                      hasAccess: stage.hasAccess,
                      completedLessons: stage.completedLessons,
                      progressPercent: stage.progressPercent,
                      isCompleted: stage.isCompleted,
                    }}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <WhyPatience locale={locale} />
      <HowItWorks locale={locale} />

      <StorePreview
        locale={locale}
        closed={!settings.store.enabled}
        products={previewProducts.map((product) => ({
          slug: product.slug,
          name: locale === 'ar' ? product.nameAr : product.nameEn,
          image: product.images?.[0] ?? null,
          priceCents: product.priceCents,
          currency: product.currency,
        }))}
      />

      <FinalCta locale={locale} />
    </>
  );
}
