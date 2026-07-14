import { z } from 'zod';

export const timeslotInput = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  label: z.string().max(120).optional(),
});

export const participantSeed = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().max(60).optional(),
});

export const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  cadence: z.enum(['ONE_OFF', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('ONE_OFF'),
  timezone: z.string().default('UTC'),
  rangeStart: z.string().datetime().optional(),
  rangeEnd: z.string().datetime().optional(),
  requireEmail: z.boolean().default(false),
  allowEditAfterSubmit: z.boolean().default(true),
  notifyOnResponse: z.boolean().default(true),
  notifyOnComplete: z.boolean().default(true),
  dailySummary: z.boolean().default(false),
  captchaEnabled: z.boolean().default(false),
  logoUrl: z.string().url().optional().or(z.literal('')),
  timeslots: z.array(timeslotInput).min(1, 'Add at least one candidate timeslot'),
  participants: z.array(participantSeed).default([]),
  sendInvites: z.boolean().default(false),
});

export const updatePollSchema = createPollSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export const submitResponseSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().max(60).optional(),
  editToken: z.string().optional(),
  answers: z
    .array(
      z.object({
        timeslotId: z.string(),
        availability: z.enum(['YES', 'MAYBE', 'NO']),
      })
    )
    .min(1),
  captchaToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const inviteAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('A valid email is required'),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  name: z.string().min(1, 'Name is required').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

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