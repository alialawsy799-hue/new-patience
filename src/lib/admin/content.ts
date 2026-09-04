import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { lessons, stages, type Lesson, type Stage } from '@/lib/db/schema';

export type StageOption = {
  id: string;
  number: number;
  titleAr: string;
  titleEn: string;
};

export async function listStageOptions(): Promise<StageOption[]> {
  await ensureMigrated();
  return db
    .select({
      id: stages.id,
      number: stages.number,
      titleAr: stages.titleAr,
      titleEn: stages.titleEn,
    })
    .from(stages)
    .orderBy(asc(stages.number));
}

export type StageListRow = Stage & { lessonCount: number; publishedLessonCount: number };

export async function listStagesForAdmin(): Promise<StageListRow[]> {
  await ensureMigrated();

  const rows = await db
    .select({
      stage: stages,
      lessonCount: sql<number>`(
        select count(*)::int from ${lessons} where ${lessons.stageId} = ${stages.id}
      )`,
      publishedLessonCount: sql<number>`(
        select count(*)::int from ${lessons}
        where ${lessons.stageId} = ${stages.id} and ${lessons.isPublished} = true
      )`,
    })
    .from(stages)
    .orderBy(asc(stages.number));

  return rows.map((row) => ({
    ...row.stage,
    lessonCount: Number(row.lessonCount),
    publishedLessonCount: Number(row.publishedLessonCount),
  }));
}

export async function getStageForAdmin(
  stageId: string,
): Promise<{ stage: Stage; lessons: Lesson[] } | null> {
  await ensureMigrated();

  const [stage] = await db.select().from(stages).where(eq(stages.id, stageId)).limit(1);
  if (!stage) return null;

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.stageId, stageId))
    .orderBy(asc(lessons.position));

  return { stage, lessons: lessonRows };
}
