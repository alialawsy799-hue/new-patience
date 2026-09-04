import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, PlayCircle } from 'lucide-react';
import { LessonList, type LessonListItem } from '@/components/student/lesson-list';
import { Reveal } from '@/components/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/states';
import { getStudentSession } from '@/lib/auth/student';
import { getStageBySlug, getStageDetail, hasStageAccess } from '@/lib/courses/queries';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { studentGreeting } from '@/lib/student/greeting';
import { firstName, formatDate, formatDuration, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).student.lessons, robots: { index: false, follow: false } };
}

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const student = await getStudentSession();
  if (!student) redirect(localePath(locale, '/courses'));

  const stage = await getStageBySlug(slug);
  if (!stage || !stage.isPublished) notFound();

  // Authorisation happens here, in the database — not by hiding a link.
  // A student who types another stage's slug lands on a 404, not on content.
  const allowed = await hasStageAccess(student.id, stage.id);
  if (!allowed) notFound();

  const [detail, settings] = await Promise.all([
    getStageDetail(stage, student.id),
    getSiteSettings(),
  ]);

  const title = locale === 'ar' ? stage.titleAr : stage.titleEn;
  const description = locale === 'ar' ? stage.descriptionAr : stage.descriptionEn;

  const nextLesson = detail.lessons.find((lesson) => !lesson.completed) ?? detail.lessons[0];
  const totalSeconds = detail.lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0);

  const items: LessonListItem[] = detail.lessons.map((lesson) => ({
    id: lesson.id,
    position: lesson.position,
    title: locale === 'ar' ? lesson.titleAr : lesson.titleEn,
    description: locale === 'ar' ? lesson.descriptionAr : lesson.descriptionEn,
    durationSeconds: lesson.durationSeconds ?? 0,
    hasVideo: lesson.hasVideo,
    completed: lesson.completed,
    progressPercent: lesson.progressPercent,
  }));

  return (
    <Section className="pt-8 sm:pt-10">
      <Container>
        <Link
          href={localePath(locale, '/student')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          {dict.student.dashboardTitle}
        </Link>

        <Reveal className="mt-6">
          <div className="relative overflow-hidden rounded-3xl bg-[var(--accent)] p-7 text-[var(--accent-foreground)] sm:p-10">
            <div className="grain absolute inset-0 opacity-[0.22]" aria-hidden />
            <div className="relative flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="latin tabular rounded-full bg-[var(--accent-foreground)]/12 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
                  {dict.courses.stageLabel} {formatNumber(stage.number, locale)}
                </span>
                {detail.isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-foreground)]/12 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {dict.courses.completed}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm opacity-80">
                  {studentGreeting(locale, student.name, student.title)}
                </p>
                <h1 className="font-display text-3xl font-extrabold leading-[1.14] tracking-tight sm:text-4xl lg:text-[2.75rem]">
                  {title}
                </h1>
                {description ? (
                  <p className="max-w-2xl text-sm leading-relaxed opacity-85 sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm opacity-90">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="size-4" aria-hidden />
                  {formatNumber(detail.totalLessons, locale)} {dict.courses.lessonsCount}
                </span>
                {totalSeconds > 0 ? (
                  <span className="latin tabular inline-flex items-center gap-2">
                    <PlayCircle className="size-4" aria-hidden />
                    {formatDuration(totalSeconds)}
                  </span>
                ) : null}
                {detail.completedAt ? (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4" aria-hidden />
                    {dict.completion.completedOn} {formatDate(detail.completedAt, locale)}
                  </span>
                ) : null}
              </div>

              {nextLesson ? (
                <div className="mt-1">
                  <ButtonLink
                    href={localePath(locale, `/student/course/${stage.slug}/lesson/${nextLesson.id}`)}
                    variant="contrast"
                    className="!bg-white !text-[var(--ink-900)]"
                    icon={<PlayCircle className="size-4.5" aria-hidden />}
                  >
                    {detail.completedLessons > 0
                      ? dict.courses.continueCourse
                      : dict.courses.startCourse}
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>

        {detail.isCompleted ? (
          <Reveal
            delay={80}
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--success-muted)] p-6"
          >
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-bold tracking-tight text-[var(--success)]">
                {dict.completion.title.replace('{name}', firstName(student.name))}
              </p>
              <p className="text-sm text-[var(--success)] opacity-85">
                {dict.completion.body.replace('{stage}', title)} — {dict.completion.certificateSoon}
              </p>
            </div>
            <Badge tone="success" className="latin tabular text-sm">
              100%
            </Badge>
          </Reveal>
        ) : null}

        <Reveal delay={120}>
          <Card className="mt-8 p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold tracking-tight">{dict.student.lessonsList}</h2>
              {nextLesson && !detail.isCompleted ? (
                <Link
                  href={localePath(locale, `/student/course/${stage.slug}/lesson/${nextLesson.id}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  {dict.student.nextLesson}
                  <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              ) : null}
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="size-6" aria-hidden />}
                title={dict.student.noLessons}
                description={dict.student.noLessonsBody}
              />
            ) : (
              <LessonList
                locale={locale}
                stageSlug={stage.slug}
                stageTitle={title}
                studentName={firstName(student.name)}
                lessons={items}
                allowManualCompletion={settings.course.allowManualCompletion}
                allowUncompletion={settings.course.allowUncompletion}
              />
            )}
          </Card>
        </Reveal>
      </Container>
    </Section>
  );
}
