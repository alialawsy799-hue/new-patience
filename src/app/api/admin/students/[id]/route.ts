import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertOperations, requireAdmin } from '@/lib/auth/admin';
import { getStudentDetail, setStudentActive } from '@/lib/admin/students';
import { grantStageAccess, revokeStageAccess } from '@/lib/codes/revoke';
import { listStageOptions } from '@/lib/admin/content';
import {
  assertSameOrigin,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  isActive: z.boolean(),
});

const accessSchema = z.object({
  stageId: z.string().uuid(),
  action: z.enum(['grant', 'revoke']),
});

export const PATCH = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertOperations(admin);

    const { id } = await context.params;
    const existing = await getStudentDetail(id);
    if (!existing) return notFound();

    const parsed = await readJson(request, (value) => patchSchema.parse(value));
    if (!parsed.ok) return parsed.response;

    await setStudentActive(id, parsed.data.isActive);

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: parsed.data.isActive ? 'student.reactivated' : 'student.deactivated',
      entityType: 'student',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);

export const POST = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertOperations(admin);

    const { id } = await context.params;
    const existing = await getStudentDetail(id);
    if (!existing) return notFound();

    const parsed = await readJson(request, (value) => accessSchema.parse(value));
    if (!parsed.ok) return parsed.response;

    const stages = await listStageOptions();
    if (!stages.some((stage) => stage.id === parsed.data.stageId)) return notFound();

    if (parsed.data.action === 'grant') {
      await grantStageAccess(id, parsed.data.stageId);
    } else {
      await revokeStageAccess(id, parsed.data.stageId);
    }

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: parsed.data.action === 'grant' ? 'student.access_granted' : 'student.access_revoked',
      entityType: 'stage',
      entityId: parsed.data.stageId,
      metadata: { studentId: id },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
