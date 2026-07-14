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
