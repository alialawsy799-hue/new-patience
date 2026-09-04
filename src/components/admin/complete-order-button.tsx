'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { OrderStatus } from '@/lib/db/schema';

export function CompleteOrderButton({
  orderId,
  status,
  dict,
}: {
  orderId: string;
  status: OrderStatus;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const done = status === 'completed';
  const cancelled = status === 'cancelled';

  async function complete() {
    if (done || cancelled || pending) return;
    setPending(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: 'completed' }),
    });
    setPending(false);
    router.refresh();
  }

  if (done) {
    return (
      <span className="text-sm font-semibold text-[var(--success)]">{dict.orders.statusCompleted}</span>
    );
  }

  if (cancelled) return null;

  return (
    <Button type="button" size="sm" loading={pending} onClick={() => void complete()}>
      {pending ? dict.common.working : dict.orders.markCompleted}
    </Button>
  );
}
