import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

/**
 * Duplicates a poll's title, description, settings, and timeslots
 * (shifted forward by the poll's cadence if one is set) without carrying
 * over participants or responses — the standard flow for setting up the
 * next occurrence of a recurring coordination meeting.
 */
export async function POST(_req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const source = await prisma.poll.findUnique({
    where: { slug: params.slug },
    include: { timeslots: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!source || source.adminId !== admin.adminId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const shiftMs = cadenceShiftMs(source.cadence);

  const duplicate = await prisma.poll.create({
    data: {
      title: `${source.title} (copy)`,
      description: source.description,
      cadence: source.cadence,
      timezone: source.timezone,
      requireEmail: source.requireEmail,
      allowEditAfterSubmit: source.allowEditAfterSubmit,
      notifyOnResponse: source.notifyOnResponse,
      notifyOnComplete: source.notifyOnComplete,
      dailySummary: source.dailySummary,
      captchaEnabled: source.captchaEnabled,
      logoUrl: source.logoUrl,
      adminId: admin.adminId,
      timeslots: {
        create: source.timeslots.map((t, i) => ({
          startsAt: new Date(t.startsAt.getTime() + shiftMs),
          endsAt: new Date(t.endsAt.getTime() + shiftMs),
          label: t.label,
          sortOrder: i,
        })),
      },
    },
  });

  return NextResponse.json({ poll: duplicate }, { status: 201 });
}

function cadenceShiftMs(cadence: string): number {
  const day = 24 * 60 * 60 * 1000;
  switch (cadence) {
    case 'WEEKLY':
      return 7 * day;
    case 'BIWEEKLY':
      return 14 * day;
    case 'MONTHLY':
      return 30 * day;
    default:
      return 0;
  }
}
