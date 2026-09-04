import 'server-only';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import {
  contactMessages,
  orderItems,
  orders,
  productCategories,
  products,
  auditLogs,
  type MessageStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Product,
  type ProductCategory,
} from '@/lib/db/schema';
import { escapeLike } from './codes';
import { buildPageInfo, type PageInfo } from './pagination';

export type AdminProductRow = Product & {
  categoryNameAr: string | null;
  categoryNameEn: string | null;
};

export async function listAdminProducts(filters: {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
}): Promise<{ rows: AdminProductRow[]; pageInfo: PageInfo }> {
  await ensureMigrated();

  const clauses: SQL[] = [];
  if (filters.categoryId) clauses.push(eq(products.categoryId, filters.categoryId));
  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const match = or(
      ilike(products.nameAr, pattern),
      ilike(products.nameEn, pattern),
      ilike(products.slug, pattern),
    );
    if (match) clauses.push(match);
  }
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const rows = await db
    .select({
      product: products,
      categoryNameAr: productCategories.nameAr,
      categoryNameEn: productCategories.nameEn,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(where)
    .orderBy(asc(products.sortOrder), desc(products.createdAt))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  return {
    rows: rows.map((row) => ({
      ...row.product,
      categoryNameAr: row.categoryNameAr,
      categoryNameEn: row.categoryNameEn,
    })),
    pageInfo,
  };
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  await ensureMigrated();
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function listAdminCategories(): Promise<(ProductCategory & { productCount: number })[]> {
  await ensureMigrated();
  const rows = await db
    .select({
      category: productCategories,
      productCount: sql<number>`(
        select count(*)::int from ${products} where ${products.categoryId} = ${productCategories.id}
      )`,
    })
    .from(productCategories)
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.nameEn));

  return rows.map((row) => ({ ...row.category, productCount: Number(row.productCount) }));
}

export async function listAdminOrders(filters: {
  page: number;
  pageSize: number;
  search?: string;
  status?: OrderStatus;
}): Promise<{ rows: Order[]; pageInfo: PageInfo }> {
  await ensureMigrated();

  const clauses: SQL[] = [];
  if (filters.status) clauses.push(eq(orders.status, filters.status));
  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const match = or(
      ilike(orders.orderNumber, pattern),
      ilike(orders.customerName, pattern),
      ilike(orders.customerEmail, pattern),
    );
    if (match) clauses.push(match);
  }
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(orders)
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  return { rows, pageInfo };
}

const PENDING_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'] as const;

export async function getOrderBoard(): Promise<{
  counts: { total: number; pending: number; successful: number };
  pending: Order[];
  successful: Order[];
}> {
  await ensureMigrated();

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${orders.status} not in ('completed', 'cancelled'))::int`,
      successful: sql<number>`count(*) filter (where ${orders.status} = 'completed')::int`,
    })
    .from(orders);

  const [pending, successful] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(inArray(orders.status, [...PENDING_STATUSES]))
      .orderBy(desc(orders.createdAt))
      .limit(40),
    db
      .select()
      .from(orders)
      .where(eq(orders.status, 'completed'))
      .orderBy(desc(orders.createdAt))
      .limit(40),
  ]);

  return {
    counts: {
      total: Number(totals?.total ?? 0),
      pending: Number(totals?.pending ?? 0),
      successful: Number(totals?.successful ?? 0),
    },
    pending,
    successful,
  };
}

export async function getAdminOrder(
  id: string,
): Promise<(Order & { items: OrderItem[] }) | null> {
  await ensureMigrated();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));
  return { ...order, items };
}

export async function listAdminMessages(filters: {
  page: number;
  pageSize: number;
  search?: string;
  status?: MessageStatus;
}) {
  await ensureMigrated();

  const clauses: SQL[] = [];
  if (filters.status) clauses.push(eq(contactMessages.status, filters.status));
  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const match = or(
      ilike(contactMessages.name, pattern),
      ilike(contactMessages.email, pattern),
      ilike(contactMessages.subject, pattern),
    );
    if (match) clauses.push(match);
  }
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const rows = await db
    .select()
    .from(contactMessages)
    .where(where)
    .orderBy(desc(contactMessages.createdAt))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  return { rows, pageInfo };
}

export async function listAuditLogs(filters: { page: number; pageSize: number; action?: string }) {
  await ensureMigrated();

  const where = filters.action ? eq(auditLogs.action, filters.action) : undefined;

  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(where);

  const pageInfo = buildPageInfo(filters.page, filters.pageSize, Number(totalRow?.value ?? 0));

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageInfo.pageSize)
    .offset(pageInfo.offset);

  return { rows, pageInfo };
}
