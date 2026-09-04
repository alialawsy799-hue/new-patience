import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { createAdminSession, getAdminSession } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { env } from '@/lib/env';
import {
  assertSameOrigin,
  fail,
  json,
  rateLimited,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { verifyPassword } from '@/lib/security/password';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const existing = await getAdminSession();
  if (existing) return json({ ok: true });

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const limitKey = `admin-login:${ip}`;

  const limit = await consumeRateLimit(
    limitKey,
    env.rateLimits.adminLoginMaxAttempts,
    env.rateLimits.adminLoginWindowMinutes * 60,
  );
  if (!limit.allowed) {
    await recordAudit({
      actorType: 'anonymous',
      action: 'security.rate_limited',
      entityType: 'admin',
      metadata: { retryAfterSeconds: limit.retryAfterSeconds },
      ipAddress: ip,
      userAgent,
    });
    return rateLimited(limit.retryAfterSeconds);
  }

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  await ensureMigrated();

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${email}`)
    .limit(1);

  const passwordOk = admin ? await verifyPassword(parsed.data.password, admin.passwordHash) : false;

  if (!admin || !passwordOk) {
    await recordAudit({
      actorType: 'anonymous',
      action: 'admin.login_failed',
      entityType: 'admin',
      metadata: { email },
      ipAddress: ip,
      userAgent,
    });
    return fail('invalid_credentials', 401);
  }

  if (!admin.isActive) return fail('inactive', 403);

  await resetRateLimit(limitKey);
  await createAdminSession(admin);
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, admin.id));

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'admin.login',
    entityType: 'admin',
    entityId: admin.id,
    ipAddress: ip,
    userAgent,
  });

  return json({ ok: true, name: admin.name, role: admin.role });
});
