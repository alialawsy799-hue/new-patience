'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/field';
import type { AdminDictionary } from '@/lib/i18n/admin';
import type { OrderStatus } from '@/lib/db/schema';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'] as const;

export function OrderStatusForm({
  orderId,
  status,
  dict,
}: {
  orderId: string;
  status: OrderStatus;
  dict: AdminDictionary;
}) {
  const router = useRouter();
  const labels: Record<string, string> = {
    pending: dict.orders.statusPending,
    confirmed: dict.orders.statusConfirmed,
    processing: dict.orders.statusProcessing,
    shipped: dict.orders.statusShipped,
    completed: dict.orders.statusCompleted,
    cancelled: dict.orders.statusCancelled,
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = String(new FormData(event.currentTarget).get('status'));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <SelectField name="status" label={dict.orders.updateStatus} defaultValue={status}>
        {statuses.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </SelectField>
      <Button type="submit">{dict.common.save}</Button>
    </form>
  );
}
