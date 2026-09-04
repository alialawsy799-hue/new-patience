'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Lock, Play } from 'lucide-react';
import { ActivationDialog } from '@/components/courses/activation-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAccent } from '@/lib/design/stage-accents';
import { getDictionary, localePath, type Locale } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';

export type StageCardData = {
  id: string;
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  lessonCount: number;
  hasAccess: boolean;
  completedLessons: number;
  progressPercent: number;
  isCompleted: boolean;
};

export function StageCard({
  locale,
  stage,
  index = 0,
}: {
  locale: Locale;
  stage: StageCardData;
  index?: number;
}) {
  const dict = getDictionary(locale);
  const accent = getAccent(stage.accent);
  const [dialogOpen, setDialogOpen] = useState(false);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const href = localePath(locale, `/student/course/${stage.slug}`);
  const ctaLabel = stage.isCompleted
    ? dict.courses.reviewCourse
    : stage.progressPercent > 0
      ? dict.courses.continueCourse
      : stage.hasAccess
        ? dict.courses.startCourse
        : dict.courses.clickToUnlock;

  const statusBadge = stage.isCompleted
    ? { tone: 'success' as const, label: dict.courses.completed }
    : stage.hasAccess
      ? stage.progressPercent > 0
        ? { tone: 'accent' as const, label: dict.courses.inProgress }
        : { tone: 'accent' as const, label: dict.courses.unlocked }
      : { tone: 'outline' as const, label: dict.courses.locked };

  const body = (
    <>
      {/* Accent wash — each stage takes one mood from the brand palette. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-500 group-hover:opacity-100',
          accent.wash,
        )}
      />

      <div className="relative flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span
            aria-hidden
            className="latin -mt-2 text-6xl font-extrabold leading-none tracking-tighter opacity-15 sm:text-7xl"
            style={{ color: accent.color }}
          >
            {String(stage.number).padStart(2, '0')}
          </span>

          <div className="flex flex-col items-end gap-3">
            <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
            <div
              className={cn(
                'grid size-12 place-items-center rounded-2xl transition-transform duration-500 ease-[var(--ease-out-quint)]',
                stage.hasAccess ? 'group-hover:scale-110' : 'group-hover:-rotate-6',
              )}
              style={{
                backgroundColor: stage.hasAccess ? accent.color : 'var(--surface-sunken)',
                color: stage.hasAccess ? '#fff' : 'var(--foreground-subtle)',
              }}
            >
              {stage.isCompleted ? (
                <Check className="size-5.5" aria-hidden />
              ) : stage.hasAccess ? (
                <Play className="size-5 translate-x-px rtl:-scale-x-100" aria-hidden />
              ) : (
                <Lock className="size-5" aria-hidden />
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <p
            className="text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: accent.color }}
          >
            {stage.subtitle || `${dict.courses.stageLabel} ${stage.number}`}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
            {stage.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
            {stage.description}
          </p>

          <div className="mt-5 flex items-center gap-4 text-[0.8125rem] text-[var(--foreground-subtle)]">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" aria-hidden />
              <span className="tabular">{formatNumber(stage.lessonCount, locale)}</span>
              {dict.courses.lessonsCount}
            </span>
          </div>

          {stage.hasAccess && stage.lessonCount > 0 ? (
            <Progress
              className="mt-5"
              size="sm"
              value={stage.progressPercent}
              label={dict.courses.yourProgress}
              formatValue={(value) => `${formatNumber(value, locale)}%`}
            />
          ) : null}

          <div className="mt-auto pt-6">
            <span
              className={cn(
                'inline-flex items-center gap-2 text-sm font-bold transition-all duration-300',
                'group-hover:gap-3',
              )}
              style={{ color: accent.color }}
            >
              {ctaLabel}
              <Arrow className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const shellClasses = cn(
    'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)]',
    'bg-[var(--surface)] text-start shadow-[var(--shadow-card)]',
    'transition-[transform,box-shadow,border-color] duration-400 ease-[var(--ease-out-quint)]',
    'hover:-translate-y-1.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lifted)]',
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]',
  );

  if (stage.hasAccess) {
    return (
      <Link
        href={href}
        className={shellClasses}
        style={{ animationDelay: `${index * 70}ms` }}
        aria-label={`${stage.title} — ${ctaLabel}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={shellClasses}
        style={{ animationDelay: `${index * 70}ms` }}
        aria-label={`${stage.title} — ${ctaLabel}`}
        aria-haspopup="dialog"
      >
        {body}
      </button>

      <ActivationDialog
        locale={locale}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        stageId={stage.id}
        stageTitle={stage.title}
      />
    </>
  );
}
