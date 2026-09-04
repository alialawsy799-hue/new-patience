import Link from 'next/link';
import { CompleteOrderButton } from '@/components/admin/complete-order-button';
import { Badge } from '@/components/ui/badge';
import { getOrderBoard } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';
import type { Order } from '@/lib/db/schema';
import { formatDateTime, formatNumber, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Orders' };

export default async function AdminOrdersPage() {
  const { locale, dict } = await getAdminLocaleContext();
  const board = await getOrderBoard();
  const labels: Record<string, string> = {
    pending: dict.orders.statusPending,
    confirmed: dict.orders.statusConfirmed,
    processing: dict.orders.statusProcessing,
    shipped: dict.orders.statusShipped,
    completed: dict.orders.statusCompleted,
    cancelled: dict.orders.statusCancelled,
  };

  const cards = [
    { label: dict.orders.boardTotal, value: board.counts.total },
    { label: dict.orders.boardPending, value: board.counts.pending },
    { label: dict.orders.boardSuccessful, value: board.counts.successful },
  ];

  function OrderList({ rows, empty }: { rows: Order[]; empty: string }) {
    if (rows.length === 0) {
      return <p className="text-sm text-[var(--foreground-muted)]">{empty}</p>;
    }

    return (
      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <Link href={`/admin/orders/${row.id}`} className="latin font-semibold hover:text-[var(--accent)]">
                {row.orderNumber}
              </Link>
              <p className="text-sm">{row.customerName}</p>
              <p className="latin text-sm text-[var(--foreground-muted)]">{row.customerPhone}</p>
              <p className="text-sm text-[var(--foreground-muted)]">{row.addressLine}</p>
              <p className="text-xs text-[var(--foreground-subtle)]">{formatDateTime(row.createdAt, locale)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="latin font-bold">{formatPrice(row.totalCents, row.currency, locale)}</span>
              <Badge tone={row.status === 'completed' ? 'success' : 'accent'}>{labels[row.status]}</Badge>
              <CompleteOrderButton orderId={row.id} status={row.status} dict={dict} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.orders.title}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{dict.orders.subtitle}</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {card.label}
            </p>
            <p className="latin mt-3 text-3xl font-extrabold tracking-tight">
              {formatNumber(card.value, locale)}
            </p>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{dict.orders.boardPending}</h2>
        <OrderList rows={board.pending} empty={dict.orders.emptyPending} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{dict.orders.boardSuccessful}</h2>
        <OrderList rows={board.successful} empty={dict.orders.emptySuccessful} />
      </section>
    </div>
  );
}
