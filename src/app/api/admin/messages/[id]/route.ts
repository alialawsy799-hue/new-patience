import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { assertOperations, requireAdmin } from '@/lib/auth/admin';
import { db, ensureMigrated } from '@/lib/db';
import { contactMessages, messageStatusEnum } from '@/lib/db/schema';
import {
  assertSameOrigin,
  json,
  notFound,
  readJson,
  withErrorHandling,
} from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(messageStatusEnum.enumValues),
});

export const PATCH = withErrorHandling(
  async (request, context: { params: Promise<{ id: string }> }) => {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const admin = await requireAdmin();
    assertOperations(admin);

    const { id } = await context.params;
    const parsed = await readJson(request, (value) => schema.parse(value));
    if (!parsed.ok) return parsed.response;

    await ensureMigrated();
    const updated = await db
      .update(contactMessages)
      .set({ status: parsed.data.status })
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id });

    if (updated.length === 0) return notFound();
    return json({ ok: true });
  },
);
