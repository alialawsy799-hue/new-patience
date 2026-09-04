import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { createStudentSession, getStudentSession } from '@/lib/auth/student';
import { activateCode } from '@/lib/codes/activate';
import { ensureMigrated } from '@/lib/db';
import { env } from '@/lib/env';
import { assertSameOrigin, fail, json, rateLimited, readJson, withErrorHandling } from '@/lib/api/respond';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { firstName } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().trim().min(2).max(120),
  title: z.enum(['doctor_male', 'doctor_female', 'none']).default('none'),
  locale: z.enum(['ar', 'en']).default('ar'),
  stageId: z.string().uuid().optional(),
});

/**
 * Redeems an activation code and opens a student session.
 *
 * Defences layered here, in order:
 *  1. same-origin check (CSRF),
 *  2. schema validation of every field,
 *  3. per-IP rate limit on failed attempts — the code keyspace is ~8.2e14, and
 *     with 8 tries per 15 minutes brute force is not a practical attack,
 *  4. atomic single-use claim inside a transaction (see `activateCode`),
 *  5. an audit entry for both success and failure.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  const { code, name, title, locale, stageId } = parsed.data;
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const limitKey = `activation:${ip}`;

  const limit = await consumeRateLimit(
    limitKey,
    env.rateLimits.activationMaxAttempts,
    env.rateLimits.activationWindowMinutes * 60,
  );

  if (!limit.allowed) {
    await recordAudit({
      actorType: 'anonymous',
      action: 'security.rate_limited',
      entityType: 'activation',
      metadata: { retryAfterSeconds: limit.retryAfterSeconds },
      ipAddress: ip,
      userAgent,
    });
    return rateLimited(limit.retryAfterSeconds);
  }

  await ensureMigrated();

  // A signed-in student redeeming a second code adds a stage to the same
  // profile rather than creating a duplicate account.
  const existingStudent = await getStudentSession();

  const result = await activateCode({
    rawCode: code,
    name,
    title,
    locale,
    existingStudentId: existingStudent?.id ?? null,
    expectedStageId: stageId ?? null,
    ipAddress: ip,
    userAgent,
  });

  if (!result.ok) {
    await recordAudit({
      actorType: existingStudent ? 'student' : 'anonymous',
      actorId: existingStudent?.id ?? null,
      action: 'code.activation_failed',
      entityType: 'activation_code',
      metadata: { reason: result.reason, stageScoped: Boolean(stageId) },
      ipAddress: ip,
      userAgent,
    });

    const status = result.reason === 'invalid_format' || result.reason === 'invalid_code' ? 400 : 409;
    return fail(result.reason, status);
  }

  // A correct code should not count against the attempt budget.
  await resetRateLimit(limitKey);

  await createStudentSession(result.student);

  if (!existingStudent) {
    await recordAudit({
      actorType: 'student',
      actorId: result.student.id,
      actorLabel: result.student.name,
      action: 'student.created',
      entityType: 'student',
      entityId: result.student.id,
      ipAddress: ip,
      userAgent,
    });
  }

  await recordAudit({
    actorType: 'student',
    actorId: result.student.id,
    actorLabel: result.student.name,
    action: 'code.activated',
    entityType: 'stage',
    entityId: result.stageId,
    metadata: { stageSlug: result.stageSlug, newAccess: result.granted },
    ipAddress: ip,
    userAgent,
  });

  return json({
    ok: true,
    stageSlug: result.stageSlug,
    student: {
      displayName: firstName(result.student.name),
      title: result.student.title,
    },
  });
});
