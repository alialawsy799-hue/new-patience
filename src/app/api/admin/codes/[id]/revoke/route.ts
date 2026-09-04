import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertCodes, requireAdmin } from '@/lib/auth/admin';
import { revokeActivationCode } from '@/lib/codes/revoke';
import {
  assertSameOrigin,
  fail,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z.string().trim().min(3).max(400),
});

export const POST = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertCodes(admin);

    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();

    const parsed = await readJson(request, (value) => schema.parse(value));
    if (!parsed.ok) return parsed.response;

    const result = await revokeActivationCode(id, parsed.data.reason);
    if (!result.ok) {
      return result.reason === 'not_found' ? notFound() : fail('already_revoked', 409);
    }

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'code.revoked',
      entityType: 'activation_code',
      entityId: id,
      metadata: { reason: parsed.data.reason, studentId: result.studentId, stageId: result.stageId },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
