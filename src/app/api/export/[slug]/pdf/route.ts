import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadPollResultsForExport } from '@/lib/export-data';
import { buildResultsPdf } from '@/lib/pdf';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await loadPollResultsForExport(params.slug, admin.adminId);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pdfBytes = await buildResultsPdf(data.poll.title, data.tallies, data.participantRows);
  const filename = `${slugifyFilename(data.poll.title)}-results.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function slugifyFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'poll';
}
