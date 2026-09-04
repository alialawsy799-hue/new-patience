import { recordAudit } from '@/lib/audit';
import { assertSameOrigin, json, withErrorHandling } from '@/lib/api/respond';
import { clearStudentSession, getStudentSession } from '@/lib/auth/student';
import { getAccessibleStageIds } from '@/lib/courses/queries';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { firstName } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Current session, for client components that need to know who is signed in. */
export const GET = withErrorHandling(async () => {
  const student = await getStudentSession();
  if (!student) return json({ authenticated: false });

  return json({
    authenticated: true,
    student: {
      displayName: firstName(student.name),
      title: student.title,
      locale: student.locale,
    },
    stageIds: await getAccessibleStageIds(student.id),
  });
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const student = await getStudentSession();
  await clearStudentSession();

  if (student) {
    await recordAudit({
      actorType: 'student',
      actorId: student.id,
      actorLabel: student.name,
      action: 'student.signed_out',
      entityType: 'student',
      entityId: student.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
  }

  return json({ ok: true });
});
