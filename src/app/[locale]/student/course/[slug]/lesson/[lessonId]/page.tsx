import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, ListVideo } from 'lucide-react';
import { LessonList, type LessonListItem } from '@/components/student/lesson-list';
import { VimeoPlayer } from '@/components/student/vimeo-player';
import { Card } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/container';
import { Progress } from '@/components/ui/progress';
import { getStudentSession } from '@/lib/auth/student';
import { getStageBySlug, getStageDetail, hasStageAccess } from '@/lib/courses/queries';
import { getDictionary, interpolate, isLocale, localePath, type Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/settings';
import { firstName, formatDuration, formatNumber } from '@/lib/utils';

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

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}) {
  const { locale: rawLocale, slug, lessonId } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const student = await getStudentSession();
  if (!student) redirect(localePath(locale, '/courses'));

  const stage = await getStageBySlug(slug);
  if (!stage || !stage.isPublished) notFound();

  const allowed = await hasStageAccess(student.id, stage.id);
  if (!allowed) notFound();

  const [detail, settings] = await Promise.all([
    getStageDetail(stage, student.id),
    getSiteSettings(),
  ]);

  const index = detail.lessons.findIndex((lesson) => lesson.id === lessonId);
  // The lesson must belong to *this* stage; a valid id from another stage is
  // not reachable by swapping the slug in the URL.
  if (index === -1) notFound();

  const lesson = detail.lessons[index];
  const previous = index > 0 ? detail.lessons[index - 1] : null;
  const next = index < detail.lessons.length - 1 ? detail.lessons[index + 1] : null;

  const stageTitle = locale === 'ar' ? stage.titleAr : stage.titleEn;
  const lessonTitle = locale === 'ar' ? lesson.titleAr : lesson.titleEn;
  const lessonDescription = locale === 'ar' ? lesson.descriptionAr : lesson.descriptionEn;

  const items: LessonListItem[] = detail.lessons.map((item) => ({
    id: item.id,
    position: item.position,
    title: locale === 'ar' ? item.titleAr : item.titleEn,
    description: locale === 'ar' ? item.descriptionAr : item.descriptionEn,
    durationSeconds: item.durationSeconds ?? 0,
    hasVideo: item.hasVideo,
    completed: item.completed,
    progressPercent: item.progressPercent,
  }));

  return (
    <Section className="pt-8 sm:pt-10">
      <Container>
        <Link
          href={localePath(locale, `/student/course/${stage.slug}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          {dict.student.backToLessons}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <VimeoPlayer locale={locale} lessonId={lesson.id} watermark={student.name} />

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                <span>{stageTitle}</span>
                <span aria-hidden>·</span>
                <span className="latin">
                  {interpolate(dict.student.lessonNumber, {
                    number: formatNumber(lesson.position, locale),
                  })}
                </span>
                {lesson.durationSeconds ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="latin tabular inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <Clock className="size-3.5" aria-hidden />
                      {formatDuration(lesson.durationSeconds)}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                {lessonTitle}
              </h1>

              {lessonDescription ? (
                <p className="max-w-2xl leading-relaxed text-[var(--foreground-muted)]">
                  {lessonDescription}
                </p>
              ) : null}
            </div>

            <nav
              className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6"
              aria-label={dict.student.lessonsList}
            >
              {previous ? (
                <Link
                  href={localePath(locale, `/student/course/${stage.slug}/lesson/${previous.id}`)}
                  className="group flex min-w-0 flex-1 items-center gap-3 text-start"
                >
                  <ChevronLeft
                    className="size-5 shrink-0 text-[var(--foreground-subtle)] transition-colors group-hover:text-[var(--accent)] rtl:-scale-x-100"
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
                      {dict.student.previousLesson}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {locale === 'ar' ? previous.titleAr : previous.titleEn}
                    </span>
                  </span>
                </Link>
              ) : (
                <span className="flex-1" />
              )}

              {next ? (
                <Link
                  href={localePath(locale, `/student/course/${stage.slug}/lesson/${next.id}`)}
                  className="group flex min-w-0 flex-1 items-center justify-end gap-3 text-end"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
                      {dict.student.nextLesson}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {locale === 'ar' ? next.titleAr : next.titleEn}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-[var(--foreground-subtle)] transition-colors group-hover:text-[var(--accent)] rtl:-scale-x-100"
                    aria-hidden
                  />
                </Link>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <div className="mb-5 flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
                  <ListVideo className="size-4" aria-hidden />
                  {dict.student.lessonsList}
                </h2>
                <Progress
                  value={detail.progressPercent}
                  size="sm"
                  label={dict.student.courseProgress}
                  formatValue={(value) => `${formatNumber(value, locale)}%`}
                  ariaLabel={dict.a11y.progressBar}
                />
              </div>

              <div className="scrollbar-slim -mx-1 max-h-[60vh] overflow-y-auto px-1 lg:max-h-[calc(100dvh-20rem)]">
                <LessonList
                  locale={locale}
                  stageSlug={stage.slug}
                  stageTitle={stageTitle}
                  studentName={firstName(student.name)}
                  lessons={items}
                  activeLessonId={lesson.id}
                  variant="compact"
                  allowManualCompletion={settings.course.allowManualCompletion}
                  allowUncompletion={settings.course.allowUncompletion}
                />
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
