import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompleteOrderButton } from '@/components/admin/complete-order-button';
import { OrderStatusForm } from '@/components/admin/order-status';
import { getAdminOrder } from '@/lib/admin/catalog';
import { getAdminLocaleContext } from '@/lib/admin/context';
import { formatDateTime, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Order' };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, dict } = await getAdminLocaleContext();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/admin/orders" className="text-sm font-semibold text-[var(--accent)]">
        ← {dict.orders.backToList}
      </Link>
      <div>
        <h1 className="latin text-3xl font-extrabold tracking-tight">{order.orderNumber}</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">{formatDateTime(order.createdAt, locale)}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <OrderStatusForm orderId={order.id} status={order.status} dict={dict} />
        <CompleteOrderButton orderId={order.id} status={order.status} dict={dict} />
      </div>
      <section className="rounded-2xl border border-[var(--border)] p-5 text-sm">
        <h2 className="font-bold">{dict.orders.customer}</h2>
        <p className="mt-2">{order.customerName}</p>
        <p className="latin mt-1">{order.customerEmail}</p>
        <p className="latin mt-1">{order.customerPhone}</p>
        <p className="mt-2 text-[var(--foreground-muted)]">
          {[order.addressLine, order.city, order.country].filter(Boolean).join(', ')}
        </p>
        <p className="mt-3">{order.notes || dict.orders.noNotes}</p>
      </section>
      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>
              {locale === 'ar' ? item.nameAr : item.nameEn} × {item.quantity}
            </span>
            <span className="latin font-semibold">{formatPrice(item.lineTotalCents, order.currency, locale)}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt>{dict.orders.subtotal}</dt>
          <dd className="latin">{formatPrice(order.subtotalCents, order.currency, locale)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{dict.orders.shipping}</dt>
          <dd className="latin">{formatPrice(order.shippingCents, order.currency, locale)}</dd>
        </div>
        <div className="flex justify-between text-base font-bold">
          <dt>{dict.orders.total}</dt>
          <dd className="latin">{formatPrice(order.totalCents, order.currency, locale)}</dd>
        </div>
      </dl>
    </div>
  );
}
