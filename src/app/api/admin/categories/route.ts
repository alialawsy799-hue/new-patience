import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertStore, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { productCategories } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';
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
  nameAr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  descriptionAr: z.string().trim().max(1000).default(''),
  descriptionEn: z.string().trim().max(1000).default(''),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  isActive: z.boolean().default(true),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertStore(admin);

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  await ensureMigrated();
  const slug = parsed.data.slug || slugify(parsed.data.nameEn);

  try {
    const [category] = await db
      .insert(productCategories)
      .values({ ...parsed.data, slug, imageUrl: parsed.data.imageUrl || null })
      .returning({ id: productCategories.id });

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'category.created',
      entityType: 'category',
      entityId: category.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true, id: category.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('product_categories_slug_unique')) return fail('slug_taken', 409);
    throw error;
  }
});

const patchSchema = schema.partial();

export const PATCH = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertStore(admin);

  const parsed = await readJson(request, (value) =>
    patchSchema.extend({ id: z.string().uuid() }).parse(value),
  );
  if (!parsed.ok) return parsed.response;

  const { id, ...fields } = parsed.data;
  await ensureMigrated();
  const [existing] = await db
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(eq(productCategories.id, id))
    .limit(1);
  if (!existing) return notFound();

  await db
    .update(productCategories)
    .set({ ...fields, imageUrl: fields.imageUrl === undefined ? undefined : fields.imageUrl || null, updatedAt: new Date() })
    .where(eq(productCategories.id, id));

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'category.updated',
    entityType: 'category',
    entityId: id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return json({ ok: true });
});

export const DELETE = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertStore(admin);

  const parsed = await readJson(request, (value) => z.object({ id: z.string().uuid() }).parse(value));
  if (!parsed.ok) return parsed.response;

  await ensureMigrated();
  const deleted = await db
    .delete(productCategories)
    .where(eq(productCategories.id, parsed.data.id))
    .returning({ id: productCategories.id });
  if (deleted.length === 0) return notFound();

  return json({ ok: true });
});
