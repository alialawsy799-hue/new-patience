import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  assertSameOrigin,
  fail,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getStudentSession } from '@/lib/auth/student';
import { db } from '@/lib/db';
import { cartItems, products } from '@/lib/db/schema';
import { getSiteSettings } from '@/lib/settings';
import {
  MAX_QUANTITY_PER_ITEM,
  getCartSummary,
  getOrCreateCartId,
  loadCart,
  removeCartItem,
  setCartItem,
} from '@/lib/store/cart';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM).default(1),
});

const setSchema = z
  .object({
    itemId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
  })
  .refine((value) => Boolean(value.itemId ?? value.productId), {
    message: 'itemId or productId is required',
    path: ['itemId'],
  });

const removeSchema = z.object({ itemId: z.string().uuid() });

/** The product is re-read on every mutation: the client never states a price. */
async function loadPurchasable(productId: string) {
  const [product] = await db
    .select({ id: products.id, stock: products.stock, isActive: products.isActive, comingSoon: products.comingSoon })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return product && product.isActive ? product : null;
}

async function currentQuantity(cartId: string, productId: string): Promise<number> {
  const [row] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);

  return row?.quantity ?? 0;
}

async function openCart(): Promise<string> {
  const student = await getStudentSession();
  return getOrCreateCartId(student?.id ?? null);
}

export const GET = withErrorHandling(async () => {
  const settings = await getSiteSettings();
  if (!settings.store.enabled) return notFound();

  return json(await getCartSummary(settings.store.currency));
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const settings = await getSiteSettings();
  if (!settings.store.enabled) return notFound();

  const parsed = await readJson(request, (value) => addSchema.parse(value));
  if (!parsed.ok) return parsed.response;

  const product = await loadPurchasable(parsed.data.productId);
  if (!product) return notFound();
  if (product.comingSoon) return fail('coming_soon', 409);
  if (product.stock <= 0) return fail('out_of_stock', 409);

  const cartId = await openCart();
  const existing = await currentQuantity(cartId, product.id);
  const target = Math.min(existing + parsed.data.quantity, product.stock, MAX_QUANTITY_PER_ITEM);

  // Already holding everything the shelf (or the per-item cap) allows.
  if (target <= existing) return fail('out_of_stock', 409, { details: { max: existing } });

  await setCartItem(cartId, product.id, target);
  return json(await loadCart(cartId, settings.store.currency));
});

export const PATCH = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const settings = await getSiteSettings();
  if (!settings.store.enabled) return notFound();

  const parsed = await readJson(request, (value) => setSchema.parse(value));
  if (!parsed.ok) return parsed.response;

  const cartId = await openCart();

  let productId = parsed.data.productId ?? null;
  if (!productId && parsed.data.itemId) {
    const [row] = await db
      .select({ productId: cartItems.productId })
      .from(cartItems)
      .where(and(eq(cartItems.id, parsed.data.itemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    if (!row) return notFound();
    productId = row.productId;
  }
  if (!productId) return notFound();

  const { quantity } = parsed.data;

  if (quantity > 0) {
    const product = await loadPurchasable(productId);
    if (!product) return notFound();
    if (product.comingSoon) return fail('coming_soon', 409);
    if (quantity > product.stock) {
      return fail('out_of_stock', 409, { details: { max: Math.max(product.stock, 0) } });
    }
  }

  await setCartItem(cartId, productId, quantity);
  return json(await loadCart(cartId, settings.store.currency));
});

export const DELETE = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const settings = await getSiteSettings();
  if (!settings.store.enabled) return notFound();

  const parsed = await readJson(request, (value) => removeSchema.parse(value));
  if (!parsed.ok) return parsed.response;

  const cartId = await openCart();
  await removeCartItem(cartId, parsed.data.itemId);

  return json(await loadCart(cartId, settings.store.currency));
});
