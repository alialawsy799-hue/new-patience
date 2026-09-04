'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AdminDictionary } from '@/lib/i18n/admin';

export function ProductStockButton({
  productId,
  stock,
  dict,
}: {
  productId: string;
  stock: number;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const soldOut = stock <= 0;

  async function markSoldOut() {
    if (soldOut || pending) return;
    setPending(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ stock: 0 }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={soldOut || pending}
      onClick={() => void markSoldOut()}
      className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
    >
      {soldOut ? dict.products.soldOutAlready : pending ? dict.common.working : dict.products.markSoldOut}
    </button>
  );
}
