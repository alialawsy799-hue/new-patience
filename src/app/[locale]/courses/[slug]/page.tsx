import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StageCard } from '@/components/courses/stage-card';
import { Container, Section } from '@/components/ui/container';
import { getStudentSession } from '@/lib/auth/student';
import { getStageBySlug, listStageCards } from '@/lib/courses/queries';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const stage = await getStageBySlug(slug);
  if (!stage) return {};
  const title = locale === 'ar' ? stage.titleAr : stage.titleEn;
  const description = locale === 'ar' ? stage.descriptionAr : stage.descriptionEn;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/courses/${slug}`,
      languages: { ar: `/ar/courses/${slug}`, en: `/en/courses/${slug}` },
    },
  };
}

export default async function CourseStagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const stage = await getStageBySlug(slug);
  if (!stage || !stage.isPublished) notFound();

  const student = await getStudentSession();
  const cards = await listStageCards(student?.id ?? null);
  const card = cards.find((item) => item.id === stage.id);
  if (!card) notFound();

  if (card.hasAccess) {
    redirect(localePath(locale, `/student/course/${stage.slug}`));
  }

  return (
    <Section className="pt-14 sm:pt-16">
      <Container size="narrow">
        <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
          {dict.courses.pageEyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
          {locale === 'ar' ? stage.titleAr : stage.titleEn}
        </h1>
        <p className="mt-4 text-lg text-[var(--foreground-muted)]">
          {locale === 'ar' ? stage.descriptionAr : stage.descriptionEn}
        </p>
        <div className="mt-10">
          <StageCard
            locale={locale}
            stage={{
              id: card.id,
              slug: card.slug,
              number: card.number,
              title: locale === 'ar' ? card.titleAr : card.titleEn,
              subtitle: locale === 'ar' ? card.subtitleAr : card.subtitleEn,
              description: locale === 'ar' ? card.descriptionAr : card.descriptionEn,
              accent: card.accent,
              lessonCount: card.lessonCount,
              hasAccess: card.hasAccess,
              completedLessons: card.completedLessons,
              progressPercent: card.progressPercent,
              isCompleted: card.isCompleted,
            }}
          />
        </div>
      </Container>
    </Section>
  );
}
