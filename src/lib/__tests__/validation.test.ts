import { describe, expect, it } from 'vitest';
import { acceptInviteSchema, inviteAdminSchema } from '../validation';

describe('admin invite validation', () => {
  it('accepts a valid admin invite payload', () => {
    const result = acceptInviteSchema.safeParse({
      token: 'abc123',
      name: 'Taylor',
      password: 'StrongPass123!',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid admin invite request payload', () => {
    const result = inviteAdminSchema.safeParse({
      name: 'Taylor',
      email: 'taylor@example.com',
    });

    expect(result.success).toBe(true);
  });
});
