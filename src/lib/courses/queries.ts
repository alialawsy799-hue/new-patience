import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import {
  lessonProgress,
  lessons,
  stageCompletions,
  stages,
  studentStageAccess,
  type Lesson,
  type Stage,
} from '@/lib/db/schema';

export type StageCard = Stage & {
  lessonCount: number;
  hasAccess: boolean;
  completedLessons: number;
  progressPercent: number;
  isCompleted: boolean;
};

export type LessonWithProgress = Lesson & {
  completed: boolean;
  progressPercent: number;
  lastPositionSeconds: number;
  hasVideo: boolean;
};

export type StageDetail = {
  stage: Stage;
  lessons: LessonWithProgress[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: Date | null;
};

/**
 * Stage list for the courses page.
 *
 * Access is resolved from `student_stage_access` on the server. The client is
 * told whether a stage is unlocked purely so it can render the right label —
 * every route that serves stage content re-checks access independently.
 */
export async function listStageCards(studentId: string | null): Promise<StageCard[]> {
  await ensureMigrated();

  const rows = await db
    .select({
      stage: stages,
      lessonCount: sql<number>`(
        select count(*)::int from ${lessons}
        where ${lessons.stageId} = ${stages.id} and ${lessons.isPublished} = true
      )`,
    })
    .from(stages)
    .where(eq(stages.isPublished, true))
    .orderBy(asc(stages.number));

  if (!studentId) {
    return rows.map(({ stage, lessonCount }) => ({
      ...stage,
      lessonCount: Number(lessonCount),
      hasAccess: false,
      completedLessons: 0,
      progressPercent: 0,
      isCompleted: false,
    }));
  }

  const [accessRows, progressRows, completionRows] = await Promise.all([
    db
      .select({ stageId: studentStageAccess.stageId })
      .from(studentStageAccess)
      .where(
        and(
          eq(studentStageAccess.studentId, studentId),
          eq(studentStageAccess.isRevoked, false),
        ),
      ),
    db
      .select({
        stageId: lessons.stageId,
        completed: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(
        and(
          eq(lessonProgress.studentId, studentId),
          eq(lessonProgress.completed, true),
          eq(lessons.isPublished, true),
        ),
      )
      .groupBy(lessons.stageId),
    db
      .select({ stageId: stageCompletions.stageId })
      .from(stageCompletions)
      .where(eq(stageCompletions.studentId, studentId)),
  ]);

  const accessible = new Set(accessRows.map((row) => row.stageId));
  const completedByStage = new Map(progressRows.map((row) => [row.stageId, Number(row.completed)]));
  const completedStages = new Set(completionRows.map((row) => row.stageId));

  return rows.map(({ stage, lessonCount }) => {
    const total = Number(lessonCount);
    const completed = completedByStage.get(stage.id) ?? 0;
    return {
      ...stage,
      lessonCount: total,
      hasAccess: accessible.has(stage.id),
      completedLessons: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      isCompleted: completedStages.has(stage.id),
    };
  });
}

export async function getStageBySlug(slug: string): Promise<Stage | null> {
  await ensureMigrated();
  const [stage] = await db.select().from(stages).where(eq(stages.slug, slug)).limit(1);
  return stage ?? null;
}

/**
 * The single authorisation gate for stage content.
 *
 * Every page, API route and video authorisation call goes through this. It is
 * a database check, never a UI check — changing the URL or the request body
 * cannot get a student into a stage they did not activate.
 */
export async function hasStageAccess(studentId: string, stageId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: studentStageAccess.id })
    .from(studentStageAccess)
    .where(
      and(
        eq(studentStageAccess.studentId, studentId),
        eq(studentStageAccess.stageId, stageId),
        eq(studentStageAccess.isRevoked, false),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getAccessibleStageIds(studentId: string): Promise<string[]> {
  const rows = await db
    .select({ stageId: studentStageAccess.stageId })
    .from(studentStageAccess)
    .where(
      and(eq(studentStageAccess.studentId, studentId), eq(studentStageAccess.isRevoked, false)),
    );
  return rows.map((row) => row.stageId);
}

/** Lessons plus this student's progress. Callers must check access first. */
export async function getStageDetail(
  stage: Stage,
  studentId: string,
): Promise<StageDetail> {
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.stageId, stage.id), eq(lessons.isPublished, true)))
    .orderBy(asc(lessons.position));

  const lessonIds = lessonRows.map((lesson) => lesson.id);

  const progressRows = lessonIds.length
    ? await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.studentId, studentId),
            inArray(lessonProgress.lessonId, lessonIds),
          ),
        )
    : [];

  const progressByLesson = new Map(progressRows.map((row) => [row.lessonId, row]));

  const merged: LessonWithProgress[] = lessonRows.map((lesson) => {
    const progress = progressByLesson.get(lesson.id);
    return {
      ...lesson,
      completed: progress?.completed ?? false,
      progressPercent: progress?.progressPercent ?? 0,
      lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
      hasVideo: Boolean(lesson.vimeoVideoId),
    };
  });

  const completedLessons = merged.filter((lesson) => lesson.completed).length;
  const totalLessons = merged.length;

  const [completion] = await db
    .select()
    .from(stageCompletions)
    .where(
      and(eq(stageCompletions.studentId, studentId), eq(stageCompletions.stageId, stage.id)),
    )
    .limit(1);

  return {
    stage,
    lessons: merged,
    totalLessons,
    completedLessons,
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    isCompleted: totalLessons > 0 && completedLessons === totalLessons,
    completedAt: completion?.completedAt ?? null,
  };
}

/** Fetches one lesson together with the stage it belongs to. */
export async function getLessonWithStage(lessonId: string) {
  const [row] = await db
    .select({ lesson: lessons, stage: stages })
    .from(lessons)
    .innerJoin(stages, eq(lessons.stageId, stages.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return row ?? null;
}

/**
 * Recomputes whether a stage is finished and records the completion once.
 * Returns true the first time a stage flips to complete.
 */
export async function syncStageCompletion(
  studentId: string,
  stageId: string,
): Promise<{ completed: boolean; newlyCompleted: boolean; completedLessons: number; totalLessons: number }> {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${lessonProgress.completed} = true)::int`,
    })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.studentId, studentId)),
    )
    .where(and(eq(lessons.stageId, stageId), eq(lessons.isPublished, true)));

  const total = Number(totals?.total ?? 0);
  const completed = Number(totals?.completed ?? 0);
  const isComplete = total > 0 && completed >= total;

  if (!isComplete) {
    // Un-ticking a lesson (or an admin publishing a new one) withdraws the
    // completion record so the celebration screen stays truthful.
    await db
      .delete(stageCompletions)
      .where(
        and(eq(stageCompletions.studentId, studentId), eq(stageCompletions.stageId, stageId)),
      );
    return {
      completed: false,
      newlyCompleted: false,
      completedLessons: completed,
      totalLessons: total,
    };
  }

  const inserted = await db
    .insert(stageCompletions)
    .values({ studentId, stageId, lessonsCompleted: completed })
    .onConflictDoNothing({ target: [stageCompletions.studentId, stageCompletions.stageId] })
    .returning({ id: stageCompletions.id });

  return {
    completed: true,
    newlyCompleted: inserted.length > 0,
    completedLessons: completed,
    totalLessons: total,
  };
}
