import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { db, ensureMigrated } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { locales } from '@/lib/i18n';
import {
  assertSameOrigin,
  json,
  rateLimited,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const CONTACT_LIMIT = 6;
const CONTACT_WINDOW_SECONDS = 3600;

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(''),
  subject: z.string().trim().max(160).default(''),
  message: z.string().trim().min(12).max(4000),
  locale: z.enum(locales).default('ar'),
});

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  const limit = await consumeRateLimit(`contact:${ip}`, CONTACT_LIMIT, CONTACT_WINDOW_SECONDS);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  await ensureMigrated();
  const [row] = await db
    .insert(contactMessages)
    .values({
      ...parsed.data,
      ipAddress: ip,
    })
    .returning({ id: contactMessages.id });

  await recordAudit({
    actorType: 'anonymous',
    action: 'contact.message_received',
    entityType: 'contact_message',
    entityId: row.id,
    metadata: { email: parsed.data.email },
    ipAddress: ip,
    userAgent: getUserAgent(request),
  });

  return json({ ok: true }, { status: 201 });
});
