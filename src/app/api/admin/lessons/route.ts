import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertCourses, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { lessons, stages } from '@/lib/db/schema';
import {
  assertSameOrigin,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { isLessonVideoRef } from '@/lib/vimeo';

export const dynamic = 'force-dynamic';

const vimeoId = z
  .string()
  .trim()
  .max(400)
  .refine((value) => value === '' || isLessonVideoRef(value), 'video')
  .transform((value) => (value === '' ? null : value));

const schema = z.object({
  stageId: z.string().uuid(),
  titleAr: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  descriptionAr: z.string().trim().max(4000).default(''),
  descriptionEn: z.string().trim().max(4000).default(''),
  vimeoVideoId: vimeoId.optional().nullable(),
  vimeoHash: z.string().trim().max(80).optional().nullable(),
  thumbnailUrl: z.string().trim().max(500).optional().nullable(),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  isPublished: z.boolean().default(true),
  isPreview: z.boolean().default(false),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertCourses(admin);
  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  await ensureMigrated();
  const [stage] = await db
    .select({ id: stages.id })
    .from(stages)
    .where(eq(stages.id, parsed.data.stageId))
    .limit(1);
  if (!stage) return notFound();

  const [last] = await db
    .select({ position: lessons.position })
    .from(lessons)
    .where(eq(lessons.stageId, parsed.data.stageId))
    .orderBy(sql`${lessons.position} desc`)
    .limit(1);

  const [lesson] = await db
    .insert(lessons)
    .values({
      ...parsed.data,
      vimeoVideoId: parsed.data.vimeoVideoId || null,
      vimeoHash: parsed.data.vimeoHash || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      position: (last?.position ?? 0) + 1,
    })
    .returning({ id: lessons.id });

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'lesson.created',
    entityType: 'lesson',
    entityId: lesson.id,
    metadata: { stageId: parsed.data.stageId },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return json({ ok: true, id: lesson.id }, { status: 201 });
});
