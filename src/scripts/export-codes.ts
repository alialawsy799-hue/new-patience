import fs from 'node:fs';
import path from 'node:path';
import { buildCodeExport, toCsv, toPdf, toXlsx } from '@/lib/codes/export';
import { ensureMigrated } from '@/lib/db';

/**
 * Re-exports every activation code with its current status.
 *
 *   npm run codes:export
 *
 * Unused codes carry an empty Student and Activation Date, exactly as the
 * printable code book expects.
 */
async function main() {
  await ensureMigrated();

  const rows = await buildCodeExport();
  if (rows.length === 0) {
    console.log('No activation codes found. Run `npm run codes:generate` first.');
    process.exit(0);
  }

  const outDir = path.resolve(process.cwd(), 'exports');
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });

  const csvPath = path.join(outDir, 'PATIENCE_COURSE_CODES.csv');
  const xlsxPath = path.join(outDir, 'PATIENCE_COURSE_CODES.xlsx');
  const pdfPath = path.join(outDir, 'PATIENCE_COURSE_CODES.pdf');

  fs.writeFileSync(csvPath, toCsv(rows), { mode: 0o600 });
  fs.writeFileSync(xlsxPath, await toXlsx(rows), { mode: 0o600 });
  fs.writeFileSync(pdfPath, await toPdf(rows), { mode: 0o600 });

  const activated = rows.filter((row) => row.status === 'ACTIVATED').length;
  const revoked = rows.filter((row) => row.status === 'REVOKED').length;

  console.log(`✓ Exported ${rows.length} codes.`);
  console.log(`  unused: ${rows.length - activated - revoked} · activated: ${activated} · revoked: ${revoked}`);
  console.log(`  ${csvPath}`);
  console.log(`  ${xlsxPath}`);
  console.log(`  ${pdfPath}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('✗ Export failed:', error);
  process.exit(1);
});
