import { db } from '@/lib/db';
import { activationCodes, codeBatches } from '@/lib/db/schema';
import {
  activationCodeHint,
  encryptActivationCode,
  generateActivationCode,
  hashActivationCode,
} from '@/lib/security/crypto';

export type GeneratedCode = { code: string; stageId: string };

export type GenerateResult = {
  batchId: string;
  inserted: number;
  /** Raw codes — held in memory only long enough to be written to a file. */
  codes: GeneratedCode[];
};

const INSERT_CHUNK = 250;

/**
 * Mints `quantity` fresh codes for one stage.
 *
 * Uniqueness is guaranteed on three levels:
 *  1. codes are drawn from a cryptographic RNG over a ~8.2e14 keyspace,
 *  2. an in-run `Set` catches collisions before any database round-trip,
 *  3. `activation_codes.code_hash` carries a UNIQUE index, so even a race
 *     between two administrators generating at the same moment cannot produce
 *     a duplicate — the insert is retried with a fresh code instead.
 */
export async function generateCodesForStage(options: {
  stageId: string;
  quantity: number;
  label: string;
  createdByAdminId?: string | null;
}): Promise<GenerateResult> {
  const { stageId, quantity, label, createdByAdminId = null } = options;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) {
    throw new Error('Quantity must be an integer between 1 and 10,000.');
  }

  const [batch] = await db
    .insert(codeBatches)
    .values({ label, stageId, quantity, createdByAdminId })
    .returning({ id: codeBatches.id });

  const seen = new Set<string>();
  const codes: GeneratedCode[] = [];
  let pending: { code: string; hash: string }[] = [];
  let inserted = 0;

  const flush = async () => {
    if (pending.length === 0) return;

    const rows = pending.map(({ code, hash }) => ({
      codeHash: hash,
      codeCipher: encryptActivationCode(code),
      codeHint: activationCodeHint(code),
      stageId,
      batchId: batch.id,
      status: 'unused' as const,
    }));

    const result = await db
      .insert(activationCodes)
      .values(rows)
      // A collision on the unique hash simply drops that row; the shortfall is
      // detected by the loop below and regenerated.
      .onConflictDoNothing({ target: activationCodes.codeHash })
      .returning({ codeHash: activationCodes.codeHash });

    const storedHashes = new Set(result.map((row) => row.codeHash));
    for (const entry of pending) {
      if (storedHashes.has(entry.hash)) codes.push({ code: entry.code, stageId });
    }

    inserted += result.length;
    pending = [];
  };

  let guard = 0;
  while (codes.length + pending.length < quantity) {
    if (guard++ > quantity * 20) {
      throw new Error('Code generation failed to reach the requested quantity.');
    }

    const code = generateActivationCode();
    if (seen.has(code)) continue;
    seen.add(code);

    pending.push({ code, hash: hashActivationCode(code) });
    if (pending.length >= INSERT_CHUNK) await flush();
  }

  await flush();

  return { batchId: batch.id, inserted, codes };
}
