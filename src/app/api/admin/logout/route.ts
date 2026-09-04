import { recordAudit } from '@/lib/audit';
import { clearAdminSession, getAdminSession } from '@/lib/auth/admin';
import { assertSameOrigin, json, withErrorHandling } from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await getAdminSession();
  await clearAdminSession();

  if (admin) {
    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'admin.logout',
      entityType: 'admin',
      entityId: admin.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });
  }

  return json({ ok: true });
});
