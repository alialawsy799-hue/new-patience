import { and, eq } from 'drizzle-orm';
import { forbidden, json, notFound, withErrorHandling } from '@/lib/api/respond';
import { requireStudent } from '@/lib/auth/student';
import { db, ensureMigrated } from '@/lib/db';
import { lessonProgress } from '@/lib/db/schema';
import { getLessonWithStage, hasStageAccess } from '@/lib/courses/queries';
import { buildLessonEmbed } from '@/lib/vimeo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Video authorisation.
 *
 * Nothing about a lesson's video is sent to the browser until the server has
 * confirmed, in this order:
 *   1. the request carries a valid student session,
 *   2. the student's account is active (checked inside `requireStudent`),
 *   3. the lesson exists and is published,
 *   4. the lesson's stage is published,
 *   5. the student holds non-revoked access to that exact stage.
 *
 * Changing the lesson id in the URL therefore cannot reveal another stage's
 * video — the check is on the stage the lesson actually belongs to.
 */
export const GET = withErrorHandling(async (_request: Request, context: unknown) => {
  const { params } = context as { params: Promise<{ lessonId: string }> };
  const { lessonId } = await params;

  const student = await requireStudent();
  await ensureMigrated();

  const record = await getLessonWithStage(lessonId);
  if (!record) return notFound();

  const { lesson, stage } = record;
  if (!lesson.isPublished || !stage.isPublished) return notFound();

  const allowed = await hasStageAccess(student.id, stage.id);
  if (!allowed) return forbidden();

  const [progress] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, student.id), eq(lessonProgress.lessonId, lesson.id)))
    .limit(1);

  if (!lesson.vimeoVideoId) {
    return json({ available: false, resumeAtSeconds: progress?.lastPositionSeconds ?? 0 });
  }

  return json({
    available: true,
    // Only the embed URL crosses the boundary — never an API token, and never
    // a direct file URL.
    embedUrl: buildLessonEmbed(lesson.vimeoVideoId, lesson.vimeoHash),
    durationSeconds: lesson.durationSeconds,
    resumeAtSeconds: progress?.lastPositionSeconds ?? 0,
    completed: progress?.completed ?? false,
  });
});
