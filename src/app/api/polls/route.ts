import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { createPollSchema } from '@/lib/validation';
import { sendEmail, invitationEmail } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');

  const polls = await prisma.poll.findMany({
    where: {
      adminId: admin.adminId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { participants: true, timeslots: true } },
    },
  });

  return NextResponse.json({ polls });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createPollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const poll = await prisma.poll.create({
    data: {
      title: data.title,
      description: data.description,
      cadence: data.cadence,
      timezone: data.timezone,
      rangeStart: data.rangeStart ? new Date(data.rangeStart) : undefined,
      rangeEnd: data.rangeEnd ? new Date(data.rangeEnd) : undefined,
      requireEmail: data.requireEmail,
      allowEditAfterSubmit: data.allowEditAfterSubmit,
      notifyOnResponse: data.notifyOnResponse,
      notifyOnComplete: data.notifyOnComplete,
      dailySummary: data.dailySummary,
      captchaEnabled: data.captchaEnabled,
      logoUrl: data.logoUrl || undefined,
      adminId: admin.adminId,
      timeslots: {
        create: data.timeslots.map((t, i) => ({
          startsAt: new Date(t.startsAt),
          endsAt: new Date(t.endsAt),
          label: t.label,
          sortOrder: i,
        })),
      },
      ...(data.participants.length
        ? {
            invitations: {
              create: data.participants
                .filter((p) => p.email)
                .map((p) => ({ name: p.name, email: p.email as string })),
            },
          }
        : {}),
    },
    include: { timeslots: true, invitations: true },
  });

  if (data.sendInvites && poll.invitations.length > 0) {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const pollUrl = `${appUrl}/poll/${poll.slug}`;
    await Promise.all(
      poll.invitations.map(async (invite) => {
        const { subject, html } = invitationEmail(poll.title, pollUrl);
        try {
          await sendEmail({ to: invite.email, subject, html });
          await prisma.invitation.update({
            where: { id: invite.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } catch (err) {
          console.error('[invite] failed to send', invite.email, err);
          await prisma.invitation.update({
            where: { id: invite.id },
            data: { status: 'FAILED' },
          });
        }
      })
    );
  }

  return NextResponse.json({ poll }, { status: 201 });
}
