import nodemailer from 'nodemailer';

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends transactional email through whichever provider is configured.
 * Invitation emails are optional (see poll.notifyOnResponse etc.) — if no
 * provider is configured, this logs and no-ops instead of throwing, so
 * poll creation/response flows never fail because email isn't set up.
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? 'resend';

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      console.warn('[mailer] RESEND_API_KEY / EMAIL_FROM not set — skipping send:', subject);
      return;
    }
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
    return;
  }

  if (provider === 'smtp') {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;
    if (!SMTP_HOST || !EMAIL_FROM) {
      console.warn('[mailer] SMTP_HOST / EMAIL_FROM not set — skipping send:', subject);
      return;
    }
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({ from: EMAIL_FROM, to, subject, html });
    return;
  }

  console.warn('[mailer] Unknown EMAIL_PROVIDER:', provider);
}

export function invitationEmail(pollTitle: string, pollUrl: string, adminName?: string) {
  return {
    subject: `You're invited: ${pollTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060D24;padding:32px;border-radius:12px">
        <div style="color:#E79B2D;font-size:11px;font-weight:700;letter-spacing:0.2em;margin-bottom:12px">YORK CONSTRUCTION</div>
        <h2 style="color:#FFFFFF">${escapeHtml(pollTitle)}</h2>
        <p style="color:#C7CDD9">${escapeHtml(adminName ?? 'The project team')} is scheduling this meeting and would
        like to know when you're available. No account or download needed —
        just open the link, check your available times, and submit.</p>
        <p style="margin:24px 0">
          <a href="${pollUrl}" style="background:#E79B2D;color:#060D24;padding:12px 24px;font-weight:700;
            border-radius:6px;text-decoration:none;display:inline-block">
            Select your availability
          </a>
        </p>
        <p style="color:#8892A6;font-size:13px">Or copy this link: ${pollUrl}</p>
      </div>
    `,
  };
}

export function reminderEmail(pollTitle: string, pollUrl: string) {
  return {
    subject: `Reminder: please share your availability for ${pollTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060D24;padding:32px;border-radius:12px">
        <div style="color:#E79B2D;font-size:11px;font-weight:700;letter-spacing:0.2em;margin-bottom:12px">YORK CONSTRUCTION</div>
        <p style="color:#C7CDD9">Quick reminder — we haven't received your availability yet for
        <strong style="color:#FFFFFF">${escapeHtml(pollTitle)}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${pollUrl}" style="background:#E79B2D;color:#060D24;padding:12px 24px;font-weight:700;
            border-radius:6px;text-decoration:none;display:inline-block">
            Select your availability
          </a>
        </p>
      </div>
    `,
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function adminInviteEmail(inviterName: string, acceptUrl: string) {
  return {
    subject: `You've been invited to York Central Scheduling`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060D24;padding:32px;border-radius:12px">
        <div style="color:#E79B2D;font-size:11px;font-weight:700;letter-spacing:0.2em;margin-bottom:12px">YORK CENTRAL</div>
        <h2 style="color:#FFFFFF">You're invited to the scheduling dashboard</h2>
        <p style="color:#C7CDD9">${inviterName} has invited you to help manage coordination polls
        on York Central Scheduling. Click below to set your password and get started.</p>
        <p style="margin:24px 0">
          <a href="${acceptUrl}" style="background:#E79B2D;color:#060D24;padding:12px 24px;font-weight:700;
            border-radius:6px;text-decoration:none;display:inline-block">
            Accept invitation
          </a>
        </p>
        <p style="color:#8892A6;font-size:13px">Or copy this link: ${acceptUrl}</p>
        <p style="color:#8892A6;font-size:12px">This invite link expires in 7 days.</p>
      </div>
    `,
  };
}