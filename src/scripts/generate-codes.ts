import fs from 'node:fs';
import path from 'node:path';
import { asc, sql } from 'drizzle-orm';
import { db, runMigrations } from '@/lib/db';
import { activationCodes, stages } from '@/lib/db/schema';
import { generateCodesForStage } from '@/lib/codes/generate';
import { recordAudit } from '@/lib/audit';
import { toCsv, toXlsx, type ExportRow } from '@/lib/codes/export';

/**
 * Mints the production activation codes.
 *
 *   npm run codes:generate                 → 500 codes for every stage
 *   npm run codes:generate -- --count=250  → 250 per stage
 *   npm run codes:generate -- --stage=3    → only stage 3
 *   npm run codes:generate -- --force      → generate even if codes exist
 *
 * The printable files are written to ./exports, which is git-ignored. Treat
 * them like cash: they are the only place the raw codes exist in plain text.
 */

function arg(name: string): string | undefined {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match?.split('=')[1];
}

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  await runMigrations();

  const perStage = Number.parseInt(arg('count') ?? '500', 10);
  const onlyStage = arg('stage') ? Number.parseInt(arg('stage')!, 10) : null;
  const force = hasFlag('force');

  if (!Number.isInteger(perStage) || perStage < 1) {
    throw new Error('--count must be a positive integer.');
  }

  const allStages = await db.select().from(stages).orderBy(asc(stages.number));
  const targets = onlyStage ? allStages.filter((s) => s.number === onlyStage) : allStages;

  if (targets.length === 0) {
    throw new Error('No stages found. Run `npm run db:seed` first.');
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(activationCodes);

  if (Number(total) > 0 && !force) {
    console.log(`✗ ${total} activation codes already exist.`);
    console.log('  Generating more would create a second batch, not replace the first.');
    console.log('  Re-run with --force if that is what you intend.');
    process.exit(1);
  }

  const generatedAt = new Date();
  const stamp = generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const label = `CLI batch ${stamp}`;
  const rows: ExportRow[] = [];

  for (const stage of targets) {
    process.stdout.write(`→ Stage ${stage.number} (${stage.titleEn}): generating ${perStage} codes… `);
    const result = await generateCodesForStage({
      stageId: stage.id,
      quantity: perStage,
      label,
    });
    console.log(`${result.inserted} stored.`);

    for (const item of result.codes) {
      rows.push({
        code: item.code,
        stage: stage.titleEn,
        stageNumber: stage.number,
        status: 'UNUSED',
        student: '',
        activatedAt: '',
      });
    }

    await recordAudit({
      actorType: 'system',
      actorLabel: 'codes:generate CLI',
      action: 'code.generated',
      entityType: 'stage',
      entityId: stage.id,
      metadata: { quantity: result.inserted, batchId: result.batchId },
    });
  }

  const outDir = path.resolve(process.cwd(), 'exports');
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });

  const csvPath = path.join(outDir, 'PATIENCE_COURSE_CODES.csv');
  fs.writeFileSync(csvPath, toCsv(rows), { mode: 0o600 });

  const xlsxPath = path.join(outDir, 'PATIENCE_COURSE_CODES.xlsx');
  fs.writeFileSync(xlsxPath, await toXlsx(rows), { mode: 0o600 });

  console.log('');
  console.log(`✓ ${rows.length} codes generated across ${targets.length} stage(s).`);
  console.log(`  ${csvPath}`);
  console.log(`  ${xlsxPath}  (one worksheet per stage)`);
  console.log('');
  console.log('  These two files contain the only plain-text copy of the codes.');
  console.log('  ./exports is git-ignored and written with owner-only permissions.');
  console.log('  Store them somewhere safe and do not share them publicly.');
  process.exit(0);
}

main().catch((error) => {
  console.error('✗ Code generation failed:', error);
  process.exit(1);
});
