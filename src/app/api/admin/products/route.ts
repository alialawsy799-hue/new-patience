import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertStore, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';
import {
  assertSameOrigin,
  fail,
  json,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const productSchema = z.object({
  nameAr: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  categoryId: z.string().uuid().nullable().optional(),
  shortDescriptionAr: z.string().trim().max(400).default(''),
  shortDescriptionEn: z.string().trim().max(400).default(''),
  descriptionAr: z.string().trim().max(8000).default(''),
  descriptionEn: z.string().trim().max(8000).default(''),
  priceCents: z.number().int().min(0).max(100_000_000),
  compareAtPriceCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  currency: z.string().trim().length(3).default('IQD'),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  images: z.array(z.string().trim().max(500)).max(8).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  comingSoon: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertStore(admin);

  const parsed = await readJson(request, (value) => productSchema.parse(value));
  if (!parsed.ok) return parsed.response;

  await ensureMigrated();
  const slug = parsed.data.slug || slugify(parsed.data.nameEn) || `product-${Date.now()}`;

  try {
    const [product] = await db
      .insert(products)
      .values({
        ...parsed.data,
        slug,
        currency: parsed.data.currency.toUpperCase(),
        compareAtPriceCents: parsed.data.compareAtPriceCents || null,
        images: parsed.data.images.filter(Boolean),
      })
      .returning({ id: products.id });

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'product.created',
      entityType: 'product',
      entityId: product.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true, id: product.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('products_slug_unique')) return fail('slug_taken', 409);
    throw error;
  }
});
