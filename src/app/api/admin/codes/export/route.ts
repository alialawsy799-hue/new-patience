import { NextResponse } from 'next/server';
import { recordAudit } from '@/lib/audit';
import { assertCodes, requireAdmin } from '@/lib/auth/admin';
import { buildCodeExport, toCsv, toPdf, toXlsx } from '@/lib/codes/export';
import { fail, withErrorHandling } from '@/lib/api/respond';
import { getClientIp, getUserAgent } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request) => {
  const admin = await requireAdmin();
  assertCodes(admin);

  const url = new URL(request.url);
  const requested = url.searchParams.get('format');
  const format = requested === 'xlsx' || requested === 'pdf' ? requested : 'csv';
  const stageId = url.searchParams.get('stageId') || undefined;
  if (stageId && !/^[0-9a-f-]{36}$/i.test(stageId)) return fail('bad_request', 400);

  const rows = await buildCodeExport({ stageId });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename =
    format === 'xlsx'
      ? `PATIENCE_COURSE_CODES_${stamp}.xlsx`
      : format === 'pdf'
        ? `PATIENCE_COURSE_CODES_${stamp}.pdf`
        : `PATIENCE_COURSE_CODES_${stamp}.csv`;

  await recordAudit({
    actorType: 'admin',
    actorId: admin.id,
    actorLabel: admin.name,
    action: 'code.exported',
    entityType: 'activation_code',
    metadata: { format, count: rows.length, stageId: stageId ?? null },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  if (format === 'xlsx') {
    const buffer = await toXlsx(rows);
    return new NextResponse(Uint8Array.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  if (format === 'pdf') {
    const buffer = await toPdf(rows);
    return new NextResponse(Uint8Array.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
});
