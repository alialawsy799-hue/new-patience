import 'server-only';
import { cookies } from 'next/headers';
import { and, eq, sql } from 'drizzle-orm';
import { db, ensureMigrated } from '@/lib/db';
import { cartItems, carts, products } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { CART_COOKIE, CART_MAX_AGE, MAX_QUANTITY_PER_ITEM } from './constants';

export { CART_COOKIE, MAX_QUANTITY_PER_ITEM };

export type CartLine = {
  itemId: string;
  productId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string | null;
  unitPriceCents: number;
  currency: string;
  quantity: number;
  stock: number;
  lineTotalCents: number;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string;
};

export const emptyCart = (currency: string): CartSummary => ({
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  currency,
});

/**
 * The cart is identified by an opaque random token in an http-only cookie, and
 * only its SHA-256 is stored. A leaked database row therefore cannot be used to
 * take over someone's cart.
 */
async function findCartByCookie(): Promise<{ id: string } | null> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;

  await ensureMigrated();
  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.tokenHash, sha256(token)))
    .limit(1);

  return cart ?? null;
}

/** Read-only: safe to call while rendering (never writes a cookie). */
export async function getCartSummary(currency: string): Promise<CartSummary> {
  const cart = await findCartByCookie();
  if (!cart) return emptyCart(currency);
  return loadCart(cart.id, currency);
}

export async function getCartItemCount(): Promise<number> {
  const cart = await findCartByCookie();
  if (!cart) return 0;

  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));

  return Number(row?.total ?? 0);
}

/** Write path — only valid inside a Route Handler or Server Action. */
export async function getOrCreateCartId(studentId: string | null): Promise<string> {
  const existing = await findCartByCookie();
  if (existing) return existing.id;

  const token = randomToken(24);
  const [cart] = await db
    .insert(carts)
    .values({ tokenHash: sha256(token), studentId })
    .returning({ id: carts.id });

  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CART_MAX_AGE,
  });

  return cart.id;
}

export async function loadCart(cartId: string, fallbackCurrency: string): Promise<CartSummary> {
  const rows = await db
    .select({
      itemId: cartItems.id,
      quantity: cartItems.quantity,
      productId: products.id,
      slug: products.slug,
      nameAr: products.nameAr,
      nameEn: products.nameEn,
      images: products.images,
      priceCents: products.priceCents,
      currency: products.currency,
      stock: products.stock,
      isActive: products.isActive,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.createdAt);

  const lines: CartLine[] = rows
    .filter((row) => row.isActive)
    .map((row) => {
      // Never let the cart promise more than the shelf holds.
      const quantity = Math.max(1, Math.min(row.quantity, Math.max(row.stock, 0) || row.quantity));
      return {
        itemId: row.itemId,
        productId: row.productId,
        slug: row.slug,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        image: row.images?.[0] ?? null,
        unitPriceCents: row.priceCents,
        currency: row.currency,
        quantity,
        stock: row.stock,
        lineTotalCents: row.priceCents * quantity,
      };
    });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
    currency: lines[0]?.currency ?? fallbackCurrency,
  };
}

export async function setCartItem(cartId: string, productId: string, quantity: number) {
  const clamped = Math.max(0, Math.min(MAX_QUANTITY_PER_ITEM, Math.trunc(quantity)));

  if (clamped === 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
    return;
  }

  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity: clamped })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity: clamped, updatedAt: new Date() },
    });
}

export async function addToCart(cartId: string, productId: string, quantity: number) {
  const delta = Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, Math.trunc(quantity)));

  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity: delta })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: {
        quantity: sql`least(${cartItems.quantity} + ${delta}, ${MAX_QUANTITY_PER_ITEM})`,
        updatedAt: new Date(),
      },
    });
}

export async function removeCartItem(cartId: string, itemId: string) {
  await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.id, itemId)));
}

export async function clearCart(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}
