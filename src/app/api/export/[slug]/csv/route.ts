import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadPollResultsForExport } from '@/lib/export-data';
import { buildResultsCsv } from '@/lib/csv';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await loadPollResultsForExport(params.slug, admin.adminId);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const csv = buildResultsCsv(data.poll.title, data.tallies, data.participantRows);
  const filename = `${slugifyFilename(data.poll.title)}-results.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function slugifyFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'poll';
}
