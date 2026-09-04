import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertCodes, requireAdmin } from '@/lib/auth/admin';
import { generateCodesForStage } from '@/lib/codes/generate';
import { listStageOptions } from '@/lib/admin/content';
import { toCsv, type ExportRow } from '@/lib/codes/export';
import { db } from '@/lib/db';
import { stages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  assertSameOrigin,
  fail,
  json,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const schema = z.object({
  stageId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10_000),
  label: z.string().trim().max(120).optional(),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertCodes(admin);

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  const [stage] = await db
    .select({ id: stages.id, number: stages.number, titleEn: stages.titleEn })
    .from(stages)
    .where(eq(stages.id, parsed.data.stageId))
    .limit(1);

  if (!stage) return fail('not_found', 404);

  const label =
    parsed.data.label?.trim() ||
    `Admin batch · stage ${stage.number} · ${new Date().toISOString().slice(0, 10)}`;

  const result = await generateCodesForStage({
    stageId: stage.id,
    quantity: parsed.data.quantity,
    label,
    createdByAdminId: admin.id,
  });

  const exportRows: ExportRow[] = result.codes.map((item) => ({
    code: item.code,
    stage: stage.titleEn,
    stageNumber: stage.number,
    status: 'UNUSED',
    student: '',
    activatedAt: '',
  }));

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'code.generated',
    entityType: 'stage',
    entityId: stage.id,
    metadata: { quantity: result.inserted, batchId: result.batchId },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return json({
    batchId: result.batchId,
    inserted: result.inserted,
    codes: result.codes.map((item) => item.code),
    csv: toCsv(exportRows),
    stages: await listStageOptions(),
  });
});
