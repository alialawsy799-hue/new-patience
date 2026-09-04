import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertStore, requireAdmin } from '@/lib/auth/admin';
import { assertSameOrigin, fail, json, withErrorHandling } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const POST = withErrorHandling(async (request) => {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin();
  assertStore(admin);

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return fail('no_file', 400);
  if (file.size > MAX_BYTES) return fail('too_large', 413);

  const ext = TYPES[file.type];
  if (!ext) return fail('unsupported_type', 415);

  const name = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'products');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return json({ url: `/uploads/products/${name}` }, { status: 201 });
});
