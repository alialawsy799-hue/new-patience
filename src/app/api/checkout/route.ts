import { z } from 'zod';
import {
  assertSameOrigin,
  fail,
  json,
  notFound,
  rateLimited,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { recordAudit } from '@/lib/audit';
import { getStudentSession } from '@/lib/auth/student';
import { locales } from '@/lib/i18n';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { getSiteSettings } from '@/lib/settings';
import { notifyTelegramNewOrder } from '@/lib/notify/telegram';
import { getOrCreateCartId } from '@/lib/store/cart';
import { OrderError, createOrder, getOrderByNumber } from '@/lib/store/orders';

export const dynamic = 'force-dynamic';

const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_SECONDS = 3600;

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(4).max(300),
  locale: z.enum(locales).default('ar'),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const settings = await getSiteSettings();
  if (!settings.store.enabled) return notFound();

  const ip = getClientIp(request);
  const limit = await consumeRateLimit(`checkout:${ip}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW_SECONDS);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, (value) => checkoutSchema.parse(value));
  if (!parsed.ok) return parsed.response;

  const { name, phone, address, locale } = parsed.data;
  const student = await getStudentSession();
  const cartId = await getOrCreateCartId(student?.id ?? null);

  try {
    const order = await createOrder({
      cartId,
      studentId: student?.id ?? null,
      locale,
      customer: {
        name,
        email: '',
        phone,
        addressLine: address,
        city: '',
        country: '',
        notes: '',
      },
    });

    const full = await getOrderByNumber(order.orderNumber);
    if (full) {
      try {
        await notifyTelegramNewOrder(full, full.items);
      } catch (error) {
        console.error('[telegram] order notification failed', error);
      }
    }

    await recordAudit({
      actorType: student ? 'student' : 'anonymous',
      actorId: student?.id ?? null,
      actorLabel: name,
      action: 'order.created',
      entityType: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        itemCount: order.itemCount,
        totalCents: order.totalCents,
        currency: order.currency,
      },
      ipAddress: ip,
      userAgent: getUserAgent(request),
    });

    return json({ orderNumber: order.orderNumber });
  } catch (error) {
    if (error instanceof OrderError) {
      return fail(error.reason, error.reason === 'empty_cart' ? 400 : 409);
    }
    throw error;
  }
});
