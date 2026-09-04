import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, PlayCircle } from 'lucide-react';
import { SignOutButton } from '@/components/student/sign-out-button';
import { Reveal } from '@/components/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/container';
import { Progress, ProgressRing } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/states';
import { getStudentSession } from '@/lib/auth/student';
import { listStageCards } from '@/lib/courses/queries';
import { getAccent } from '@/lib/design/stage-accents';
import { getDictionary, isLocale, localePath, type Locale } from '@/lib/i18n';
import { studentGreeting } from '@/lib/student/greeting';
import { cn, formatNumber, percentage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  // The learning area is private; keep it out of search results entirely.
  return { title: dict.student.dashboardTitle, robots: { index: false, follow: false } };
}

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const student = await getStudentSession();
  if (!student) redirect(localePath(locale, '/courses'));

  const allStages = await listStageCards(student.id);
  const stages = allStages.filter((stage) => stage.hasAccess);

  const totalLessons = stages.reduce((sum, stage) => sum + stage.lessonCount, 0);
  const completedLessons = stages.reduce((sum, stage) => sum + stage.completedLessons, 0);
  const overall = percentage(completedLessons, totalLessons);

  return (
    <Section className="pt-12 sm:pt-14">
      <Container>
        <Reveal className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="rule-accent text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dict.student.dashboardTitle}
            </p>
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {studentGreeting(locale, student.name, student.title)}
              <span aria-hidden> 👋</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">{dict.student.dashboardSubtitle}</p>
          </div>
          <SignOutButton locale={locale} />
        </Reveal>

        {stages.length === 0 ? (
          <EmptyState
            className="mt-14"
            icon={<BookOpen className="size-6" aria-hidden />}
            title={dict.student.noAccessTitle}
            description={dict.student.noAccessBody}
            action={
              <ButtonLink href={localePath(locale, '/courses')}>
                {dict.student.noAccessCta}
              </ButtonLink>
            }
          />
        ) : (
          <>
            <Reveal delay={80}>
              <Card className="mt-12 flex flex-col items-center gap-8 p-6 sm:flex-row sm:p-8">
                <ProgressRing value={overall} size={128} strokeWidth={9}>
                  <div className="flex flex-col items-center">
                    <span className="latin tabular text-2xl font-extrabold tracking-tight">
                      {formatNumber(overall, locale)}%
                    </span>
                    <span className="text-[0.625rem] uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
                      {dict.student.completionPercent}
                    </span>
                  </div>
                </ProgressRing>

                <dl className="grid flex-1 grid-cols-2 gap-6 xl:grid-cols-4">
                  <SummaryStat
                    label={dict.student.currentStage}
                    value={formatNumber(stages.length, locale)}
                    icon={<GraduationCap className="size-4" aria-hidden />}
                  />
                  <SummaryStat
                    label={dict.student.completedLessons}
                    value={formatNumber(completedLessons, locale)}
                    icon={<CheckCircle2 className="size-4" aria-hidden />}
                  />
                  <SummaryStat
                    label={dict.student.remainingLessons}
                    value={formatNumber(Math.max(0, totalLessons - completedLessons), locale)}
                    icon={<PlayCircle className="size-4" aria-hidden />}
                  />
                  <SummaryStat
                    label={dict.student.lessons}
                    value={formatNumber(totalLessons, locale)}
                    icon={<BookOpen className="size-4" aria-hidden />}
                  />
                </dl>
              </Card>
            </Reveal>

            <ul className={cn('mt-8 grid gap-5', stages.length > 1 && 'md:grid-cols-2')}>
              {stages.map((stage, index) => {
                const accent = getAccent(stage.accent);
                const title = locale === 'ar' ? stage.titleAr : stage.titleEn;

                return (
                  <li key={stage.id}>
                    <Reveal delay={140 + index * 70} className="h-full">
                      <Link
                        href={localePath(locale, `/student/course/${stage.slug}`)}
                        className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"
                      >
                        <Card interactive className="flex h-full flex-col gap-5 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="latin tabular grid size-11 place-items-center rounded-xl text-sm font-extrabold"
                                style={{ backgroundColor: accent.deep, color: accent.onDeep }}
                              >
                                {String(stage.number).padStart(2, '0')}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
                                  {dict.courses.stageLabel} {formatNumber(stage.number, locale)}
                                </span>
                                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                              </div>
                            </div>
                            {stage.isCompleted ? (
                              <Badge tone="success">{dict.courses.completed}</Badge>
                            ) : stage.completedLessons > 0 ? (
                              <Badge tone="accent">{dict.courses.inProgress}</Badge>
                            ) : (
                              <Badge tone="neutral">{dict.courses.unlocked}</Badge>
                            )}
                          </div>

                          <Progress
                            value={stage.progressPercent}
                            size="sm"
                            showValue={false}
                            ariaLabel={dict.a11y.progressBar}
                          />

                          <div className="mt-auto flex items-center justify-between gap-4 text-sm">
                            <span className="text-[var(--foreground-muted)]">
                              {formatNumber(stage.completedLessons, locale)} / {formatNumber(stage.lessonCount, locale)}{' '}
                              {dict.courses.lessonsCount}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)]">
                              {stage.isCompleted
                                ? dict.courses.reviewCourse
                                : stage.completedLessons > 0
                                  ? dict.courses.continueCourse
                                  : dict.courses.startCourse}
                              <ArrowRight
                                className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                                aria-hidden
                              />
                            </span>
                          </div>
                        </Card>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Container>
    </Section>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
        <span className="text-[var(--accent)]">{icon}</span>
        {label}
      </dt>
      <dd className="latin tabular text-2xl font-extrabold tracking-tight">{value}</dd>
    </div>
  );
}
