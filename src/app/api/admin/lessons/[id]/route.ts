import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertCourses, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { lessons } from '@/lib/db/schema';
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
  titleAr: z.string().trim().min(1).max(200).optional(),
  titleEn: z.string().trim().min(1).max(200).optional(),
  descriptionAr: z.string().trim().max(4000).optional(),
  descriptionEn: z.string().trim().max(4000).optional(),
  vimeoVideoId: vimeoId.optional().nullable(),
  vimeoHash: z.string().trim().max(80).optional().nullable(),
  thumbnailUrl: z.string().trim().max(500).optional().nullable(),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  isPublished: z.boolean().optional(),
  isPreview: z.boolean().optional(),
  move: z.enum(['up', 'down']).optional(),
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
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    if (!lesson) return notFound();

    if (parsed.data.move) {
      const direction = parsed.data.move === 'up' ? -1 : 1;
      const neighbours = await db
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.stageId, lesson.stageId),
            direction < 0
              ? sql`${lessons.position} < ${lesson.position}`
              : sql`${lessons.position} > ${lesson.position}`,
          ),
        )
        .orderBy(direction < 0 ? sql`${lessons.position} desc` : sql`${lessons.position} asc`)
        .limit(1);

      const neighbour = neighbours[0];
      if (neighbour) {
        await db.transaction(async (tx) => {
          await tx
            .update(lessons)
            .set({ position: neighbour.position, updatedAt: new Date() })
            .where(eq(lessons.id, lesson.id));
          await tx
            .update(lessons)
            .set({ position: lesson.position, updatedAt: new Date() })
            .where(eq(lessons.id, neighbour.id));
        });
      }
    } else {
      const { move: _move, ...fields } = parsed.data;
      await db
        .update(lessons)
        .set({
          ...fields,
          vimeoVideoId:
            fields.vimeoVideoId === undefined ? undefined : fields.vimeoVideoId || null,
          vimeoHash: fields.vimeoHash === undefined ? undefined : fields.vimeoHash || null,
          thumbnailUrl:
            fields.thumbnailUrl === undefined ? undefined : fields.thumbnailUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(lessons.id, id));
    }

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'lesson.updated',
      entityType: 'lesson',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);

export const DELETE = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertCourses(admin);
    const { id } = await context.params;

    await ensureMigrated();
    const deleted = await db.delete(lessons).where(eq(lessons.id, id)).returning({ id: lessons.id });
    if (deleted.length === 0) return notFound();

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'lesson.deleted',
      entityType: 'lesson',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
