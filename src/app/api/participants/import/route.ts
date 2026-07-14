import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { parseParticipantsCsv } from '@/lib/csv';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No CSV file provided.' }, { status: 400 });
  }

  const text = await file.text();
  try {
    const participants = parseParticipantsCsv(text);
    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No rows found. Expect columns like "name", "email".' },
        { status: 400 }
      );
    }
    return NextResponse.json({ participants });
  } catch (err) {
    console.error('[csv-import] parse failed', err);
    return NextResponse.json({ error: 'Could not parse that CSV file.' }, { status: 400 });
  }
}
