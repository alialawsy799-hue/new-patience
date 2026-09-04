import 'server-only';
import { env } from '@/lib/env';
import { getSiteSettings } from '@/lib/settings';
import type { Order, OrderItem } from '@/lib/db/schema';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString('en-US');
  return currency === 'IQD' ? `${amount} د.ع.` : `${amount} ${currency}`;
}

export async function notifyTelegramNewOrder(
  order: Order,
  items: OrderItem[],
): Promise<void> {
  const settings = await getSiteSettings();
  const token = settings.telegramOrders.botToken.trim() || env.telegram.botToken;
  const chatId = settings.telegramOrders.chatId.trim() || env.telegram.ordersChatId;
  if (!token || !chatId) return;

  const lines = items
    .map((item) => {
      const name = item.nameAr || item.nameEn;
      return `• ${escapeHtml(name)} × ${item.quantity}`;
    })
    .join('\n');

  const text = [
    '<b>طلب جديد — PATIENCE</b>',
    '',
    `<b>الرقم:</b> ${escapeHtml(order.orderNumber)}`,
    `<b>الاسم:</b> ${escapeHtml(order.customerName)}`,
    `<b>الهاتف:</b> ${escapeHtml(order.customerPhone)}`,
    `<b>العنوان:</b> ${escapeHtml(order.addressLine)}`,
    order.city ? `<b>المدينة:</b> ${escapeHtml(order.city)}` : '',
    '',
    '<b>المنتجات</b>',
    lines || '—',
    '',
    `<b>الإجمالي:</b> ${escapeHtml(money(order.totalCents, order.currency))}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[telegram] failed to send order', order.orderNumber, detail);
  }
}
