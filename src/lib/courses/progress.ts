import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lessonProgress, type Lesson } from '@/lib/db/schema';
import { clamp } from '@/lib/utils';

export type ProgressUpdate = {
  studentId: string;
  lesson: Lesson;
  /** Current playhead in seconds, as reported by the Vimeo player. */
  positionSeconds?: number;
  /** Total video length in seconds, as reported by the player. */
  durationSeconds?: number;
  /** Explicit tick/untick from the completion control. */
  completed?: boolean;
  /** Percentage at which playback auto-completes; 0 disables it. */
  autoCompleteThreshold: number;
};

export type ProgressState = {
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  lastPositionSeconds: number;
  watchedSeconds: number;
  completedAt: Date | null;
};

/**
 * Writes a student's progress for one lesson.
 *
 * Two rules matter here:
 *  - Opening a lesson never completes it. Completion requires either an
 *    explicit tick or playback passing the configured threshold.
 *  - `watchedSeconds` and the resume position only ever move forward, so
 *    scrubbing backwards cannot erase progress the student already earned.
 */
export async function recordLessonProgress(update: ProgressUpdate): Promise<ProgressState> {
  const { studentId, lesson, autoCompleteThreshold } = update;

  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.lessonId, lesson.id)),
    )
    .limit(1);

  const duration = Math.max(
    0,
    Math.round(update.durationSeconds ?? existing?.durationSeconds ?? lesson.durationSeconds ?? 0),
  );

  const reportedPosition = Math.max(0, Math.round(update.positionSeconds ?? 0));
  const position = duration > 0 ? Math.min(reportedPosition, duration) : reportedPosition;

  const lastPosition =
    update.positionSeconds === undefined
      ? (existing?.lastPositionSeconds ?? 0)
      : position;

  const watchedSeconds = Math.max(existing?.watchedSeconds ?? 0, position);

  const playbackPercent =
    duration > 0 ? clamp(Math.round((watchedSeconds / duration) * 100), 0, 100) : 0;

  const wasCompleted = existing?.completed ?? false;
  const reachedThreshold =
    autoCompleteThreshold > 0 && duration > 0 && playbackPercent >= autoCompleteThreshold;

  const completed =
    update.completed !== undefined ? update.completed : wasCompleted || reachedThreshold;

  // A completed lesson always shows 100%, otherwise the bar would sit at 94%
  // for a lesson the student has legitimately finished.
  const progressPercent = completed ? 100 : playbackPercent;

  const completedAt = completed ? (existing?.completedAt ?? new Date()) : null;

  const now = new Date();
  const [row] = await db
    .insert(lessonProgress)
    .values({
      studentId,
      lessonId: lesson.id,
      watchedSeconds,
      lastPositionSeconds: lastPosition,
      durationSeconds: duration,
      progressPercent,
      completed,
      completedAt,
      lastWatchedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.studentId, lessonProgress.lessonId],
      set: {
        watchedSeconds,
        lastPositionSeconds: lastPosition,
        durationSeconds: duration,
        progressPercent,
        completed,
        completedAt,
        lastWatchedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return {
    lessonId: row.lessonId,
    completed: row.completed,
    progressPercent: row.progressPercent,
    lastPositionSeconds: row.lastPositionSeconds,
    watchedSeconds: row.watchedSeconds,
    completedAt: row.completedAt,
  };
}
