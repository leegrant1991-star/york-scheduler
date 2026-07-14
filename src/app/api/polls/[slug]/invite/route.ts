import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { sendEmail, invitationEmail, reminderEmail } from '@/lib/mailer';
import { z } from 'zod';

const inviteRequestSchema = z.object({
  mode: z.enum(['invite', 'remind']).default('invite'),
  participants: z
    .array(z.object({ name: z.string().min(1), email: z.string().email() }))
    .optional(),
});

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const poll = await prisma.poll.findUnique({
    where: { slug: params.slug },
    include: { invitations: true, participants: true },
  });
  if (!poll || poll.adminId !== admin.adminId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inviteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { mode, participants } = parsed.data;

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const pollUrl = `${appUrl}/poll/${poll.slug}`;

  // New invitees supplied directly (e.g. added after poll creation).
  if (participants?.length) {
    for (const p of participants) {
      const exists = await prisma.invitation.findFirst({
        where: { pollId: poll.id, email: p.email },
      });
      if (!exists) {
        await prisma.invitation.create({ data: { pollId: poll.id, name: p.name, email: p.email } });
      }
    }
    // Refresh the invitation list to include any just-created rows.
    poll.invitations = await prisma.invitation.findMany({ where: { pollId: poll.id } });
  }

  const respondedEmails = new Set(poll.participants.map((p) => p.email).filter(Boolean));
  const targets =
    mode === 'remind'
      ? poll.invitations.filter((i) => !respondedEmails.has(i.email))
      : poll.invitations.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');

  const results = await Promise.allSettled(
    targets.map(async (invite) => {
      const { subject, html } =
        mode === 'remind' ? reminderEmail(poll.title, pollUrl) : invitationEmail(poll.title, pollUrl);
      await sendEmail({ to: invite.email, subject, html });
      await prisma.invitation.update({
        where: { id: invite.id },
        data:
          mode === 'remind'
            ? { remindedAt: new Date() }
            : { status: 'SENT', sentAt: new Date() },
      });
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  return NextResponse.json({ sent, failed });
}
