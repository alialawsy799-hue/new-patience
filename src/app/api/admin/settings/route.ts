import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertOperations, requireAdmin } from '@/lib/auth/admin';
import { getSiteSettings, mergeSettings, saveSiteSettings } from '@/lib/settings';
import {
  assertSameOrigin,
  json,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const urlOrEmpty = z
  .string()
  .trim()
  .max(400)
  .refine((value) => value === '' || /^https?:\/\//i.test(value), 'url');

const schema = z.object({
  general: z.object({
    siteName: z.string().trim().min(1).max(80),
    taglineAr: z.string().trim().max(200),
    taglineEn: z.string().trim().max(200),
  }),
  contact: z.object({
    email: z.string().trim().max(200),
    phone: z.string().trim().max(40),
    whatsapp: z.string().trim().max(40),
    addressAr: z.string().trim().max(300),
    addressEn: z.string().trim().max(300),
    hoursAr: z.string().trim().max(200),
    hoursEn: z.string().trim().max(200),
  }),
  social: z.object({
    instagram: urlOrEmpty,
    facebook: urlOrEmpty,
    youtube: urlOrEmpty,
    telegram: urlOrEmpty,
    x: urlOrEmpty,
    linkedin: urlOrEmpty,
  }),
  hero: z.object({
    titleAr: z.string().trim().max(200),
    titleEn: z.string().trim().max(200),
    subtitleAr: z.string().trim().max(600),
    subtitleEn: z.string().trim().max(600),
  }),
  course: z.object({
    autoCompleteThreshold: z.number().int().min(0).max(100),
    allowManualCompletion: z.boolean(),
    allowUncompletion: z.boolean(),
  }),
  store: z.object({
    enabled: z.boolean(),
    currency: z.string().trim().length(3),
    shippingFlatCents: z.number().int().min(0).max(10_000_000),
    freeShippingOverCents: z.number().int().min(0).max(100_000_000),
  }),
  telegramOrders: z.object({
    botToken: z.string().trim().max(200),
    chatId: z.string().trim().max(80),
  }),
});

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  return json(await getSiteSettings());
});

export const PUT = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertOperations(admin);

  const parsed = await readJson(request, (value) => schema.parse(value));
  if (!parsed.ok) return parsed.response;

  const saved = await saveSiteSettings(
    mergeSettings({
      ...parsed.data,
      store: {
        ...parsed.data.store,
        currency: parsed.data.store.currency.toUpperCase(),
      },
    }),
  );

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'admin.settings_updated',
    entityType: 'settings',
    entityId: 'site',
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return json({ ok: true, settings: saved });
});
