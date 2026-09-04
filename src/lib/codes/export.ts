import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activationCodes, stages, students } from '@/lib/db/schema';
import { decryptActivationCode } from '@/lib/security/crypto';

export type ExportRow = {
  code: string;
  stage: string;
  stageNumber: number;
  status: string;
  student: string;
  activatedAt: string;
};

/**
 * Builds the administrator's code export.
 *
 * This is the only place in the entire codebase that decrypts a stored code,
 * and it must only ever be reached from an admin-authenticated context.
 */
export async function buildCodeExport(options?: { stageId?: string }): Promise<ExportRow[]> {
  const rows = await db
    .select({
      cipher: activationCodes.codeCipher,
      status: activationCodes.status,
      activatedAt: activationCodes.activatedAt,
      stageNumber: stages.number,
      stageTitle: stages.titleEn,
      studentName: students.name,
    })
    .from(activationCodes)
    .innerJoin(stages, eq(activationCodes.stageId, stages.id))
    .leftJoin(students, eq(activationCodes.studentId, students.id))
    .where(options?.stageId ? eq(activationCodes.stageId, options.stageId) : undefined)
    .orderBy(asc(stages.number), asc(activationCodes.createdAt));

  return rows.map((row) => ({
    code: decryptActivationCode(row.cipher),
    stage: row.stageTitle,
    stageNumber: row.stageNumber,
    status: row.status.toUpperCase(),
    student: row.studentName ?? '',
    activatedAt: row.activatedAt ? row.activatedAt.toISOString().slice(0, 19).replace('T', ' ') : '',
  }));
}

const CSV_HEADER = ['Code', 'Stage', 'Status', 'Student', 'Activation Date'];

function escapeCsv(value: string): string {
  // A leading =, +, - or @ would be executed by Excel; prefix with a quote.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv(rows: ExportRow[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const row of rows) {
    lines.push(
      [row.code, row.stage, row.status, row.student, row.activatedAt].map(escapeCsv).join(','),
    );
  }
  // BOM so Excel opens the file as UTF-8 and Arabic student names survive.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** One worksheet per stage, exactly as requested for the printable code book. */
export async function toXlsx(rows: ExportRow[]): Promise<Buffer> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PATIENCE';
  workbook.created = new Date();

  const byStage = new Map<number, { title: string; rows: ExportRow[] }>();
  for (const row of rows) {
    const bucket = byStage.get(row.stageNumber) ?? { title: row.stage, rows: [] };
    bucket.rows.push(row);
    byStage.set(row.stageNumber, bucket);
  }

  const stageNumbers = [...byStage.keys()].sort((a, b) => a - b);
  for (const stageNumber of stageNumbers) {
    const bucket = byStage.get(stageNumber)!;
    const sheet = workbook.addWorksheet(`Stage ${stageNumber}`);

    sheet.columns = [
      { header: 'Code', key: 'code', width: 22 },
      { header: 'Stage', key: 'stage', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Student', key: 'student', width: 28 },
      { header: 'Activation Date', key: 'activatedAt', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D0C0D' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    for (const row of bucket.rows) {
      const added = sheet.addRow({
        code: row.code,
        stage: row.stage,
        status: row.status,
        student: row.student,
        activatedAt: row.activatedAt,
      });
      if (row.status === 'ACTIVATED') {
        added.getCell('status').font = { color: { argb: 'FFE25A00' }, bold: true };
      } else if (row.status === 'REVOKED') {
        added.getCell('status').font = { color: { argb: 'FFB3261E' }, bold: true };
      }
    }

    sheet.autoFilter = { from: 'A1', to: `E${bucket.rows.length + 1}` };
  }

  if (stageNumbers.length === 0) workbook.addWorksheet('Empty');

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Printable code book: one section per stage, full codes, A4. */
export async function toPdf(rows: ExportRow[]): Promise<Buffer> {
  const { default: PDFDocument } = await import('pdfkit');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: { Title: 'PATIENCE Course Codes', Author: 'PATIENCE' },
  });

  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const byStage = new Map<number, { title: string; rows: ExportRow[] }>();
  for (const row of rows) {
    const bucket = byStage.get(row.stageNumber) ?? { title: row.stage, rows: [] };
    bucket.rows.push(row);
    byStage.set(row.stageNumber, bucket);
  }

  const stageNumbers = [...byStage.keys()].sort((a, b) => a - b);
  const pageBottom = doc.page.height - 48;
  const columns = { index: 40, code: 88, status: 280, student: 370 };
  const orange = '#FE6B05';

  function drawHeader(stageNumber: number, title: string, count: number) {
    doc.rect(0, 0, doc.page.width, 8).fill(orange);
    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(16).text('PATIENCE', 40, 28);
    doc.fillColor(orange).fontSize(10).text('Course activation codes', 40, 48);
    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(13).text(`Stage ${stageNumber} — ${title}`, 40, 72);
    doc.fillColor('#666666').font('Helvetica').fontSize(9).text(`${count} codes`, 40, 90);

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#888888');
    doc.text('#', columns.index, 112);
    doc.text('CODE', columns.code, 112);
    doc.text('STATUS', columns.status, 112);
    doc.text('STUDENT', columns.student, 112);
    doc.moveTo(40, 126).lineTo(doc.page.width - 40, 126).strokeColor('#E5E5E5').stroke();
  }

  function ensureRowSpace(y: number, stageNumber: number, title: string, count: number): number {
    if (y <= pageBottom) return y;
    doc.addPage();
    drawHeader(stageNumber, title, count);
    return 138;
  }

  if (stageNumbers.length === 0) {
    drawHeader(0, 'Empty', 0);
    doc.font('Helvetica').fontSize(11).fillColor('#666666').text('No activation codes.', 40, 148);
  }

  for (const [stageIndex, stageNumber] of stageNumbers.entries()) {
    if (stageIndex > 0) doc.addPage();
    const bucket = byStage.get(stageNumber)!;
    drawHeader(stageNumber, bucket.title, bucket.rows.length);
    let y = 138;

    bucket.rows.forEach((row, index) => {
      y = ensureRowSpace(y, stageNumber, bucket.title, bucket.rows.length);
      if (index % 2 === 0) {
        doc.rect(40, y - 4, doc.page.width - 80, 16).fill('#F7F6F4');
      }
      doc.fillColor('#888888').font('Helvetica').fontSize(8).text(String(index + 1), columns.index, y, {
        width: 40,
      });
      doc.fillColor('#111111').font('Courier-Bold').fontSize(9).text(row.code, columns.code, y);
      doc.fillColor(row.status === 'ACTIVATED' ? orange : row.status === 'REVOKED' ? '#B3261E' : '#444444')
        .font('Helvetica')
        .fontSize(8)
        .text(row.status, columns.status, y);
      doc.fillColor('#444444').font('Helvetica').fontSize(8).text(row.student || '—', columns.student, y, {
        width: 180,
        ellipsis: true,
      });
      y += 16;
    });
  }

  doc.end();
  return finished;
}
