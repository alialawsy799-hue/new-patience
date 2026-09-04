import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { recordAudit } from '@/lib/audit';
import { assertStore, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { orders, orderStatusEnum } from '@/lib/db/schema';
import {
  assertSameOrigin,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(orderStatusEnum.enumValues),
});

export const PATCH = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertStore(admin);

    const { id } = await context.params;
    const parsed = await readJson(request, (value) => schema.parse(value));
    if (!parsed.ok) return parsed.response;

    await ensureMigrated();
    const [existing] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!existing) return notFound();

    await db
      .update(orders)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(orders.id, id));

    await recordAudit({
      actorType: 'admin',
      actorId: admin.id,
      actorLabel: admin.name,
      action: 'order.status_changed',
      entityType: 'order',
      entityId: id,
      metadata: { from: existing.status, to: parsed.data.status },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return json({ ok: true });
  },
);
