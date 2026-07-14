import { describe, expect, it } from 'vitest';
import { getSeedAdminCredentials } from '../seed-admin';

describe('seed admin credentials', () => {
  it('uses the requested default admin credentials when no env vars are provided', () => {
    const previousEmail = process.env.SEED_ADMIN_EMAIL;
    const previousPassword = process.env.SEED_ADMIN_PASSWORD;

    delete process.env.SEED_ADMIN_EMAIL;
    delete process.env.SEED_ADMIN_PASSWORD;

    try {
      expect(getSeedAdminCredentials()).toEqual({
        email: 'lee@york-construction.ca',
        password: 'York2026!',
      });
    } finally {
      if (previousEmail) process.env.SEED_ADMIN_EMAIL = previousEmail;
      if (previousPassword) process.env.SEED_ADMIN_PASSWORD = previousPassword;
    }
  });
});
