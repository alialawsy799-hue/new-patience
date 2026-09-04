import 'server-only';
import { and, asc, desc, eq, notInArray, sql, type SQL } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { productCategories, products, type Product } from '@/lib/db/schema';

export const productSorts = ['catalog', 'newest', 'price_asc', 'price_desc', 'popular'] as const;
export type ProductSort = (typeof productSorts)[number];

export function isProductSort(value: unknown): value is ProductSort {
  return typeof value === 'string' && (productSorts as readonly string[]).includes(value);
}

/** The lean shape a product card needs — never the full description payload. */
export type ProductCardData = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  stock: number;
  images: string[];
  isNew: boolean;
  comingSoon: boolean;
  categoryId: string | null;
  categorySlug: string | null;
  categoryNameAr: string | null;
  categoryNameEn: string | null;
};

export type ProductDetailData = Product & {
  categorySlug: string | null;
  categoryNameAr: string | null;
  categoryNameEn: string | null;
};

export type StoreCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string | null;
  productCount: number;
};

const cardColumns = {
  id: products.id,
  slug: products.slug,
  nameAr: products.nameAr,
  nameEn: products.nameEn,
  shortDescriptionAr: products.shortDescriptionAr,
  shortDescriptionEn: products.shortDescriptionEn,
  priceCents: products.priceCents,
  compareAtPriceCents: products.compareAtPriceCents,
  currency: products.currency,
  stock: products.stock,
  images: products.images,
  isNew: products.isNew,
  comingSoon: products.comingSoon,
  categoryId: products.categoryId,
  categorySlug: productCategories.slug,
  categoryNameAr: productCategories.nameAr,
  categoryNameEn: productCategories.nameEn,
};

function orderFor(sort: ProductSort): SQL[] {
  switch (sort) {
    case 'price_asc':
      return [asc(products.priceCents), asc(products.sortOrder)];
    case 'price_desc':
      return [desc(products.priceCents), asc(products.sortOrder)];
    case 'popular':
      return [desc(products.salesCount), asc(products.sortOrder)];
    case 'newest':
      return [desc(products.createdAt), asc(products.sortOrder)];
    case 'catalog':
    default:
      return [asc(productCategories.sortOrder), asc(products.sortOrder), asc(products.nameEn)];
  }
}

export async function listCategories(): Promise<StoreCategory[]> {
  await ensureMigrated();

  return db
    .select({
      id: productCategories.id,
      slug: productCategories.slug,
      nameAr: productCategories.nameAr,
      nameEn: productCategories.nameEn,
      descriptionAr: productCategories.descriptionAr,
      descriptionEn: productCategories.descriptionEn,
      imageUrl: productCategories.imageUrl,
      productCount: sql<number>`(
        select count(*)::int from ${products}
        where ${products.categoryId} = ${productCategories.id} and ${products.isActive} = true
      )`,
    })
    .from(productCategories)
    .where(eq(productCategories.isActive, true))
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.nameEn));
}

export async function listProducts({
  categorySlug,
  sort = 'catalog',
  limit,
}: {
  categorySlug?: string;
  sort?: ProductSort;
  limit?: number;
} = {}): Promise<ProductCardData[]> {
  await ensureMigrated();

  const conditions = [eq(products.isActive, true)];
  if (categorySlug) conditions.push(eq(productCategories.slug, categorySlug));

  const query = db
    .select(cardColumns)
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .orderBy(...orderFor(sort));

  return limit ? query.limit(limit) : query;
}

export async function getFeaturedProducts(limit = 4): Promise<ProductCardData[]> {
  await ensureMigrated();

  return db
    .select(cardColumns)
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true), eq(products.comingSoon, false)))
    .orderBy(asc(products.sortOrder), desc(products.salesCount))
    .limit(limit);
}

export async function getBestSellers(limit = 4): Promise<ProductCardData[]> {
  await ensureMigrated();

  return db
    .select(cardColumns)
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.isActive, true), eq(products.comingSoon, false)))
    .orderBy(desc(products.salesCount), asc(products.sortOrder))
    .limit(limit);
}

export async function getNewArrivals(limit = 4): Promise<ProductCardData[]> {
  await ensureMigrated();

  return db
    .select(cardColumns)
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.isActive, true), eq(products.isNew, true), eq(products.comingSoon, false)))
    .orderBy(desc(products.createdAt), asc(products.sortOrder))
    .limit(limit);
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  await ensureMigrated();

  const [row] = await db
    .select({
      product: products,
      categorySlug: productCategories.slug,
      categoryNameAr: productCategories.nameAr,
      categoryNameEn: productCategories.nameEn,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!row) return null;

  return {
    ...row.product,
    categorySlug: row.categorySlug,
    categoryNameAr: row.categoryNameAr,
    categoryNameEn: row.categoryNameEn,
  };
}

/**
 * Same-category products first, topped up with the rest of the catalogue so the
 * row never renders half empty on a category that only holds one item.
 */
export async function getRelatedProducts(
  product: { id: string; categoryId: string | null },
  limit = 4,
): Promise<ProductCardData[]> {
  await ensureMigrated();

  const excluded = [product.id];
  const related: ProductCardData[] = [];

  if (product.categoryId) {
    const sameCategory = await db
      .select(cardColumns)
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(products.categoryId, product.categoryId),
          eq(products.comingSoon, false),
          notInArray(products.id, excluded),
        ),
      )
      .orderBy(desc(products.salesCount), asc(products.sortOrder))
      .limit(limit);

    related.push(...sameCategory);
    excluded.push(...sameCategory.map((row) => row.id));
  }

  if (related.length >= limit) return related;

  const fillers = await db
    .select(cardColumns)
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.isActive, true), eq(products.comingSoon, false), notInArray(products.id, excluded)))
    .orderBy(desc(products.salesCount), asc(products.sortOrder))
    .limit(limit - related.length);

  return [...related, ...fillers];
}

export async function countActiveProducts(): Promise<number> {
  await ensureMigrated();

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.isActive, true));

  return Number(row?.total ?? 0);
}
