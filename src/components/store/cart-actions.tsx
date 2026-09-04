'use client';

import type { Dictionary } from '@/lib/i18n';
import type { CartSummary } from '@/lib/store/cart';

/** Opens the drawer after a successful add, from anywhere in the tree. */
export const CART_OPEN_EVENT = 'patience:cart-open';
/** Tells every mounted cart surface that the server-side cart moved. */
export const CART_CHANGED_EVENT = 'patience:cart-changed';

export type CartResult = { ok: true; cart: CartSummary } | { ok: false; error: string };

export function openCartDrawer(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
}

export function announceCartChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

function errorCode(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as { error: unknown }).error;
    if (typeof value === 'string') return value;
  }
  return 'server_error';
}

async function callCart(method: 'POST' | 'PATCH' | 'DELETE', body: unknown): Promise<CartResult> {
  try {
    const response = await fetch('/api/cart', {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: errorCode(payload) };

    return { ok: true, cart: payload as CartSummary };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export function addCartItem(productId: string, quantity = 1): Promise<CartResult> {
  return callCart('POST', { productId, quantity });
}

export function setCartQuantity(itemId: string, quantity: number): Promise<CartResult> {
  return callCart('PATCH', { itemId, quantity });
}

export function removeCartLine(itemId: string): Promise<CartResult> {
  return callCart('DELETE', { itemId });
}

export async function fetchCart(): Promise<CartSummary | null> {
  try {
    const response = await fetch('/api/cart', { credentials: 'same-origin' });
    if (!response.ok) return null;
    return (await response.json()) as CartSummary;
  } catch {
    return null;
  }
}

export function cartErrorMessage(code: string, dict: Dictionary): string {
  switch (code) {
    case 'out_of_stock':
      return dict.errors.outOfStock;
    case 'coming_soon':
      return dict.errors.comingSoon;
    case 'empty_cart':
      return dict.errors.emptyCart;
    case 'not_found':
      return dict.errors.notFound;
    case 'network':
      return dict.errors.network;
    case 'invalid_origin':
      return dict.errors.forbidden;
    default:
      return dict.errors.generic;
  }
}
