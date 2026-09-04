'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { Check, Clock, Loader2, Play, VideoOff } from 'lucide-react';
import { CompletionCelebration } from '@/components/student/completion-celebration';
import { Progress } from '@/components/ui/progress';
import { getDictionary, interpolate, localePath, type Locale } from '@/lib/i18n';
import { cn, formatDuration, formatNumber } from '@/lib/utils';

export type LessonListItem = {
  id: string;
  position: number;
  title: string;
  description: string;
  durationSeconds: number;
  hasVideo: boolean;
  completed: boolean;
  progressPercent: number;
};

type LessonListProps = {
  locale: Locale;
  stageSlug: string;
  stageTitle: string;
  studentName: string;
  lessons: LessonListItem[];
  allowManualCompletion: boolean;
  allowUncompletion: boolean;
  activeLessonId?: string;
  /** `compact` is the sidebar rendering used on the lesson page. */
  variant?: 'full' | 'compact';
};

export function LessonList({
  locale,
  stageSlug,
  stageTitle,
  studentName,
  lessons: initialLessons,
  allowManualCompletion,
  allowUncompletion,
  activeLessonId,
  variant = 'full',
}: LessonListProps) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [, startTransition] = useTransition();

  const completed = useMemo(() => lessons.filter((lesson) => lesson.completed).length, [lessons]);
  const percent = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

  const toggle = useCallback(
    async (lesson: LessonListItem) => {
      const next = !lesson.completed;
      if (next && !allowManualCompletion) return;
      if (!next && !allowUncompletion) return;

      setPendingId(lesson.id);
      // Optimistic: the control and the bar respond instantly, and the server
      // response overwrites the guess a moment later.
      setLessons((current) =>
        current.map((item) =>
          item.id === lesson.id
            ? { ...item, completed: next, progressPercent: next ? 100 : item.progressPercent }
            : item,
        ),
      );

      try {
        const response = await fetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id, completed: next }),
        });

        if (!response.ok) throw new Error('progress_failed');

        const data = (await response.json()) as {
          lesson: { completed: boolean; progressPercent: number };
          stage: { newlyCompleted: boolean };
        };

        setLessons((current) =>
          current.map((item) =>
            item.id === lesson.id
              ? {
                  ...item,
                  completed: data.lesson.completed,
                  progressPercent: data.lesson.progressPercent,
                }
              : item,
          ),
        );

        if (data.stage.newlyCompleted) setCelebrate(true);
        startTransition(() => router.refresh());
      } catch {
        // Roll the optimistic change back so the UI never lies about progress.
        setLessons((current) =>
          current.map((item) =>
            item.id === lesson.id ? { ...item, completed: lesson.completed } : item,
          ),
        );
      } finally {
        setPendingId(null);
      }
    },
    [allowManualCompletion, allowUncompletion, router],
  );

  return (
    <div className="flex flex-col gap-6">
      {variant === 'full' ? (
        <Progress
          value={percent}
          size="lg"
          label={dict.student.courseProgress}
          formatValue={(value) => `${formatNumber(value, locale)}%`}
          ariaLabel={dict.a11y.progressBar}
        />
      ) : null}

      <ol className={cn('flex flex-col', variant === 'full' ? 'gap-2' : 'gap-1')}>
        {lessons.map((lesson) => {
          const isActive = lesson.id === activeLessonId;
          const isPending = pendingId === lesson.id;
          const canToggle = lesson.completed ? allowUncompletion : allowManualCompletion;

          return (
            <li key={lesson.id}>
              <div
                className={cn(
                  'group flex items-center gap-3 rounded-xl border transition-colors duration-200',
                  variant === 'full' ? 'p-3 sm:p-4' : 'p-2.5',
                  isActive
                    ? 'border-[var(--accent)]/40 bg-[var(--accent-muted)]'
                    : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-sunken)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(lesson)}
                  disabled={!canToggle || isPending}
                  aria-label={
                    lesson.completed ? dict.student.markIncomplete : dict.student.markComplete
                  }
                  aria-pressed={lesson.completed}
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-200',
                    lesson.completed
                      ? 'border-[var(--success)] bg-[var(--success)] text-white'
                      : 'border-[var(--border-strong)] text-transparent hover:border-[var(--accent)]',
                    !canToggle && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin text-[var(--foreground-muted)]" aria-hidden />
                  ) : (
                    <Check
                      className={cn(
                        'size-3.5 transition-transform duration-200',
                        lesson.completed ? 'scale-100' : 'scale-0',
                      )}
                      aria-hidden
                    />
                  )}
                </button>

                <Link
                  href={localePath(locale, `/student/course/${stageSlug}/lesson/${lesson.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span
                    className={cn(
                      'latin tabular shrink-0 text-xs font-bold',
                      isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground-subtle)]',
                    )}
                  >
                    {String(lesson.position).padStart(2, '0')}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        'truncate font-semibold',
                        variant === 'full' ? 'text-[0.9375rem]' : 'text-sm',
                        lesson.completed && !isActive && 'text-[var(--foreground-muted)]',
                      )}
                    >
                      {lesson.title}
                    </span>
                    {variant === 'full' && lesson.description ? (
                      <span className="truncate text-xs text-[var(--foreground-subtle)]">
                        {lesson.description}
                      </span>
                    ) : null}
                  </span>

                  <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--foreground-subtle)]">
                    {lesson.hasVideo ? (
                      lesson.durationSeconds > 0 ? (
                        <span className="latin tabular flex items-center gap-1">
                          <Clock className="size-3.5" aria-hidden />
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                      ) : null
                    ) : (
                      <VideoOff className="size-3.5" aria-hidden />
                    )}
                    <Play
                      className={cn(
                        'size-3.5 opacity-0 transition-opacity duration-200 rtl:-scale-x-100',
                        'group-hover:opacity-100',
                        isActive && 'opacity-100 text-[var(--accent)]',
                      )}
                      aria-hidden
                    />
                  </span>
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      {variant === 'full' ? (
        <p className="text-sm text-[var(--foreground-subtle)]" aria-live="polite">
          {interpolate('{completed} / {total}', {
            completed: formatNumber(completed, locale),
            total: formatNumber(lessons.length, locale),
          })}{' '}
          {dict.student.completedLessons}
        </p>
      ) : null}

      <CompletionCelebration
        locale={locale}
        open={celebrate}
        onClose={() => setCelebrate(false)}
        studentName={studentName}
        stageTitle={stageTitle}
        lessonsCompleted={lessons.length}
      />
    </div>
  );
}
