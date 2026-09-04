import fs from 'node:fs';
import path from 'node:path';
import { db, runMigrations } from './index';
import {
  activationCodes,
  auditLogs,
  carts,
  contactMessages,
  lessonProgress,
  orders,
  products,
  rateLimitBuckets,
  stageCompletions,
  studentStageAccess,
  students,
} from './schema';
import { buildCodeExport, toCsv, toPdf, toXlsx } from '@/lib/codes/export';

/**
 * Clears operational / test data so the platform is empty for launch.
 * Keeps courses, lessons, products, admin, settings, and the activation codes.
 */
async function writeCodeBook() {
  const rows = await buildCodeExport();
  const outDir = path.resolve(process.cwd(), 'exports');
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });

  const csvPath = path.join(outDir, 'PATIENCE_COURSE_CODES.csv');
  const xlsxPath = path.join(outDir, 'PATIENCE_COURSE_CODES.xlsx');
  const pdfPath = path.join(outDir, 'PATIENCE_COURSE_CODES.pdf');

  fs.writeFileSync(csvPath, toCsv(rows), { mode: 0o600 });
  fs.writeFileSync(xlsxPath, await toXlsx(rows), { mode: 0o600 });
  fs.writeFileSync(pdfPath, await toPdf(rows), { mode: 0o600 });

  return { count: rows.length, csvPath, xlsxPath, pdfPath };
}

async function main() {
  console.log('→ Running migrations');
  await runMigrations();

  console.log('→ Clearing launch-time data');
  await db.delete(orders);
  await db.delete(carts);
  await db.delete(contactMessages);
  await db.delete(auditLogs);
  await db.delete(rateLimitBuckets);
  await db.delete(lessonProgress);
  await db.delete(stageCompletions);
  await db.delete(studentStageAccess);

  await db.update(activationCodes).set({
    status: 'unused',
    studentId: null,
    activatedAt: null,
    activatedIp: null,
    activatedUserAgent: null,
    revokedAt: null,
    revokedReason: null,
  });

  await db.delete(students);
  await db.update(products).set({ salesCount: 0 });

  console.log('  · students, orders, carts, messages and audit cleared');
  console.log('  · activation codes reset to unused');

  const book = await writeCodeBook();
  console.log(`  · code book written (${book.count} codes)`);
  console.log(`    ${book.pdfPath}`);

  console.log('');
  console.log('✓ Site is ready for publish.');
  process.exit(0);
}

main().catch((error) => {
  console.error('✗ Reset failed:', error);
  process.exit(1);
});
