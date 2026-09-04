import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertCourses, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { stages } from '@/lib/db/schema';
import {
  assertSameOrigin,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const schema = z.object({
  titleAr: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  subtitleAr: z.string().trim().max(200).default(''),
  subtitleEn: z.string().trim().max(200).default(''),
  descriptionAr: z.string().trim().max(4000).default(''),
  descriptionEn: z.string().trim().max(4000).default(''),
  accent: z.enum(['orange', 'elegant', 'calm', 'passion', 'sky']).default('orange'),
  coverImageUrl: z.string().trim().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const PATCH = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertCourses(admin);
    const { id } = await context.params;

    const parsed = await readJson(request, (value) => schema.parse(value));
    if (!parsed.ok) return parsed.response;

    await ensureMigrated();
    const [existing] = await db.select({ id: stages.id }).from(stages).where(eq(stages.id, id)).limit(1);
    if (!existing) return notFound();

    await db
      .update(stages)
      .set({
        ...parsed.data,
        coverImageUrl: parsed.data.coverImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(stages.id, id));

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'stage.updated',
      entityType: 'stage',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
