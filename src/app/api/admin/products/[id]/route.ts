import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertStore, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { products } from '@/lib/db/schema';
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
  nameAr: z.string().trim().min(1).max(160).optional(),
  nameEn: z.string().trim().min(1).max(160).optional(),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  categoryId: z.string().uuid().nullable().optional(),
  shortDescriptionAr: z.string().trim().max(400).optional(),
  shortDescriptionEn: z.string().trim().max(400).optional(),
  descriptionAr: z.string().trim().max(8000).optional(),
  descriptionEn: z.string().trim().max(8000).optional(),
  priceCents: z.number().int().min(0).max(100_000_000).optional(),
  compareAtPriceCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  images: z.array(z.string().trim().max(500)).max(8).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  comingSoon: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const PATCH = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertStore(admin);

    const { id } = await context.params;
    const parsed = await readJson(request, (value) => schema.parse(value));
    if (!parsed.ok) return parsed.response;

    await ensureMigrated();
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    if (!existing) return notFound();

    try {
      await db
        .update(products)
        .set({
          ...parsed.data,
          currency: parsed.data.currency?.toUpperCase(),
          images: parsed.data.images?.filter(Boolean),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('products_slug_unique')) return fail('slug_taken', 409);
      throw error;
    }

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'product.updated',
      entityType: 'product',
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
    assertStore(admin);

    const { id } = await context.params;
    await ensureMigrated();
    const deleted = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (deleted.length === 0) return notFound();

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'product.deleted',
      entityType: 'product',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
