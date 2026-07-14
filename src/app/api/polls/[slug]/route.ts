import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { updatePollSchema } from '@/lib/validation';

async function loadOwnedPoll(slug: string, adminId: string) {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      timeslots: { orderBy: { sortOrder: 'asc' } },
      participants: {
        include: { responses: true },
        orderBy: { createdAt: 'asc' },
      },
      invitations: true,
    },
  });
  if (!poll || poll.adminId !== adminId) return null;
  return poll;
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const poll = await loadOwnedPoll(params.slug, admin.adminId);
  if (!poll) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ poll });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.poll.findUnique({ where: { slug: params.slug } });
  if (!existing || existing.adminId !== admin.adminId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updatePollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const poll = await prisma.poll.update({
    where: { slug: params.slug },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.cadence !== undefined ? { cadence: data.cadence } : {}),
      ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
      ...(data.status !== undefined
        ? {
            status: data.status,
            archivedAt: data.status === 'ARCHIVED' ? new Date() : null,
          }
        : {}),
      ...(data.requireEmail !== undefined ? { requireEmail: data.requireEmail } : {}),
      ...(data.allowEditAfterSubmit !== undefined
        ? { allowEditAfterSubmit: data.allowEditAfterSubmit }
        : {}),
      ...(data.notifyOnResponse !== undefined
        ? { notifyOnResponse: data.notifyOnResponse }
        : {}),
      ...(data.notifyOnComplete !== undefined
        ? { notifyOnComplete: data.notifyOnComplete }
        : {}),
      ...(data.dailySummary !== undefined ? { dailySummary: data.dailySummary } : {}),
      ...(data.captchaEnabled !== undefined ? { captchaEnabled: data.captchaEnabled } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl || null } : {}),
    },
  });

  return NextResponse.json({ poll });
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.poll.findUnique({ where: { slug: params.slug } });
  if (!existing || existing.adminId !== admin.adminId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.poll.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
