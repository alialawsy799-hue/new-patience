import 'server-only';
import crypto from 'node:crypto';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { cartItems, orderItems, orders, products, type Order, type OrderItem } from '@/lib/db/schema';
import type { Locale } from '@/lib/i18n';
import { getSiteSettings, type SiteSettings } from '@/lib/settings';

export type OrderFailureReason = 'empty_cart' | 'out_of_stock';

export class OrderError extends Error {
  readonly reason: OrderFailureReason;

  constructor(reason: OrderFailureReason) {
    super(reason);
    this.name = 'OrderError';
    this.reason = reason;
  }
}

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
  notes: string;
};

export type CreateOrderInput = {
  cartId: string;
  studentId: string | null;
  locale: Locale;
  customer: OrderCustomer;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  itemCount: number;
};

export type OrderWithItems = Order & { items: OrderItem[] };

/** Crockford-style alphabet: an order number read over the phone stays unambiguous. */
const ORDER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ORDER_SUFFIX_LENGTH = 4;
const MAX_NUMBER_ATTEMPTS = 6;

/** Rejection sampling keeps every symbol uniformly distributed. */
function randomSuffix(): string {
  const max = Math.floor(256 / ORDER_ALPHABET.length) * ORDER_ALPHABET.length;
  let out = '';
  while (out.length < ORDER_SUFFIX_LENGTH) {
    for (const byte of crypto.randomBytes(ORDER_SUFFIX_LENGTH * 2)) {
      if (byte >= max) continue;
      out += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
      if (out.length === ORDER_SUFFIX_LENGTH) break;
    }
  }
  return out;
}

/** `PT-250824-7K4X` — sortable by eye, unique by construction. */
export function generateOrderNumber(now: Date = new Date()): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `PT-${year}${month}${day}-${randomSuffix()}`;
}

/** Shipping is flat, and waived once the basket passes the free-shipping line. */
export function calculateShipping(subtotalCents: number, store: SiteSettings['store']): number {
  if (subtotalCents <= 0) return 0;
  if (store.shippingFlatCents <= 0) return 0;
  if (store.freeShippingOverCents > 0 && subtotalCents >= store.freeShippingOverCents) return 0;
  return store.shippingFlatCents;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  if (code === '23505') return true;
  const message = error instanceof Error ? error.message : '';
  return message.includes('orders_number_unique');
}

/**
 * Places an order.
 *
 * Everything the client sent about money is ignored: prices, line totals and
 * shipping are recomputed here from the product rows, and stock is decremented
 * with a conditional `UPDATE ... WHERE stock >= quantity` so two shoppers racing
 * for the last unit cannot both succeed. Any failure rolls the transaction back,
 * leaving the cart untouched.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  await ensureMigrated();
  const settings = await getSiteSettings();

  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt += 1) {
    const orderNumber = generateOrderNumber();

    try {
      return await db.transaction(async (tx) => {
        const rows = await tx
          .select({
            productId: products.id,
            quantity: cartItems.quantity,
            nameAr: products.nameAr,
            nameEn: products.nameEn,
            images: products.images,
            priceCents: products.priceCents,
            currency: products.currency,
            isActive: products.isActive,
            comingSoon: products.comingSoon,
          })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .where(eq(cartItems.cartId, input.cartId))
          .orderBy(asc(cartItems.createdAt));

        const lines = rows.filter((row) => row.isActive && !row.comingSoon && row.quantity > 0);
        if (lines.length === 0) throw new OrderError('empty_cart');

        let subtotalCents = 0;
        let itemCount = 0;
        const snapshots: {
          productId: string;
          nameAr: string;
          nameEn: string;
          imageUrl: string | null;
          unitPriceCents: number;
          quantity: number;
          lineTotalCents: number;
        }[] = [];

        for (const line of lines) {
          const quantity = Math.trunc(line.quantity);

          const [reserved] = await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${quantity}`,
              salesCount: sql`${products.salesCount} + ${quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, line.productId),
                eq(products.isActive, true),
                eq(products.comingSoon, false),
                gte(products.stock, quantity),
              ),
            )
            .returning({ id: products.id });

          if (!reserved) throw new OrderError('out_of_stock');

          const lineTotalCents = line.priceCents * quantity;
          subtotalCents += lineTotalCents;
          itemCount += quantity;

          snapshots.push({
            productId: line.productId,
            nameAr: line.nameAr,
            nameEn: line.nameEn,
            imageUrl: line.images?.[0] ?? null,
            unitPriceCents: line.priceCents,
            quantity,
            lineTotalCents,
          });
        }

        const currency = lines[0]?.currency ?? settings.store.currency;
        const shippingCents = calculateShipping(subtotalCents, settings.store);
        const totalCents = subtotalCents + shippingCents;

        const [order] = await tx
          .insert(orders)
          .values({
            orderNumber,
            studentId: input.studentId,
            customerName: input.customer.name,
            customerEmail: input.customer.email,
            customerPhone: input.customer.phone,
            addressLine: input.customer.addressLine,
            city: input.customer.city,
            country: input.customer.country,
            notes: input.customer.notes,
            subtotalCents,
            shippingCents,
            totalCents,
            currency,
            status: 'pending',
            locale: input.locale,
          })
          .returning({ id: orders.id, orderNumber: orders.orderNumber });

        await tx.insert(orderItems).values(
          snapshots.map((snapshot) => ({ orderId: order.id, ...snapshot })),
        );

        await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
          itemCount,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_NUMBER_ATTEMPTS - 1) continue;
      throw error;
    }
  }

  throw new Error('Could not allocate a unique order number.');
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  await ensureMigrated();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));

  return { ...order, items };
}
