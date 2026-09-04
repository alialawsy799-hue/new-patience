import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import {
  assertSameOrigin,
  forbidden,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { requireStudent } from '@/lib/auth/student';
import { getLessonWithStage, hasStageAccess, syncStageCompletion } from '@/lib/courses/queries';
import { recordLessonProgress } from '@/lib/courses/progress';
import { ensureMigrated } from '@/lib/db';
import { getSiteSettings } from '@/lib/settings';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  lessonId: z.string().uuid(),
  positionSeconds: z.number().min(0).max(86_400).optional(),
  durationSeconds: z.number().min(0).max(86_400).optional(),
  completed: z.boolean().optional(),
});

/**
 * Records watch position and completion for one lesson.
 *
 * Authorisation is re-derived from the database on every call: the student
 * must hold access to the stage the lesson belongs to. A crafted request with
 * someone else's lesson id is rejected with 403, and there is no way to write
 * progress onto another student's record because the student id comes from the
 * signed session cookie, never from the request body.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  const student = await requireStudent();
  await ensureMigrated();

  const record = await getLessonWithStage(parsed.data.lessonId);
  if (!record) return notFound();

  const { lesson, stage } = record;
  if (!lesson.isPublished || !stage.isPublished) return notFound();

  const allowed = await hasStageAccess(student.id, stage.id);
  if (!allowed) return forbidden();

  const settings = await getSiteSettings();

  // Respect the administrator's rules about who may tick a lesson.
  if (parsed.data.completed === true && !settings.course.allowManualCompletion) {
    return forbidden();
  }
  if (parsed.data.completed === false && !settings.course.allowUncompletion) {
    return forbidden();
  }

  const before = parsed.data.completed;
  const progress = await recordLessonProgress({
    studentId: student.id,
    lesson,
    positionSeconds: parsed.data.positionSeconds,
    durationSeconds: parsed.data.durationSeconds,
    completed: parsed.data.completed,
    autoCompleteThreshold: settings.course.autoCompleteThreshold,
  });

  const stageState = await syncStageCompletion(student.id, stage.id);

  // Only log deliberate state changes, not every few-second heartbeat.
  if (before !== undefined) {
    await recordAudit({
      actorType: 'student',
      actorId: student.id,
      actorLabel: student.name,
      action: before ? 'lesson.completed' : 'lesson.uncompleted',
      entityType: 'lesson',
      entityId: lesson.id,
      metadata: { stageId: stage.id },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
  }

  if (stageState.newlyCompleted) {
    await recordAudit({
      actorType: 'student',
      actorId: student.id,
      actorLabel: student.name,
      action: 'stage.completed',
      entityType: 'stage',
      entityId: stage.id,
      metadata: { lessons: stageState.completedLessons },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
  }

  return json({
    ok: true,
    lesson: progress,
    stage: {
      completedLessons: stageState.completedLessons,
      totalLessons: stageState.totalLessons,
      progressPercent:
        stageState.totalLessons > 0
          ? Math.round((stageState.completedLessons / stageState.totalLessons) * 100)
          : 0,
      isCompleted: stageState.completed,
      newlyCompleted: stageState.newlyCompleted,
    },
  });
});
