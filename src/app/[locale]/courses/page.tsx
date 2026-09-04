import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen, Info } from 'lucide-react';
import { StageCard } from '@/components/courses/stage-card';
import { Reveal } from '@/components/reveal';
import { Container, Section } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/states';
import { getStudentSession } from '@/lib/auth/student';
import { listStageCards } from '@/lib/courses/queries';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';

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
    title: dict.courses.metaTitle,
    description: dict.courses.metaDescription,
    alternates: { canonical: `/${locale}/courses`, languages: { ar: '/ar/courses', en: '/en/courses' } },
    openGraph: {
      title: dict.courses.metaTitle,
      description: dict.courses.metaDescription,
      url: `/${locale}/courses`,
    },
  };
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const student = await getStudentSession();
  const stages = await listStageCards(student?.id ?? null);

  return (
    <Section className="pt-14 sm:pt-16 lg:pt-20">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            {dict.courses.pageEyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem] rtl:leading-[1.3]">
            {dict.courses.pageTitle}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
            {dict.courses.pageSubtitle}
          </p>
        </Reveal>

        {stages.length === 0 ? (
          <EmptyState
            className="mt-16"
            icon={<BookOpen className="size-6" aria-hidden />}
            title={dict.courses.noStages}
            description={dict.courses.noStagesBody}
          />
        ) : (
          <>
            <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stages.map((stage, index) => (
                <li key={stage.id}>
                  <Reveal delay={index * 80} className="h-full">
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

            <Reveal className="mt-12 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-sunken)] p-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
              <Info className="mt-0.5 size-4.5 shrink-0 text-[var(--foreground-subtle)]" aria-hidden />
              {dict.courses.accessNote}
            </Reveal>
          </>
        )}
      </Container>
    </Section>
  );
}
