import { afterEach, describe, expect, it } from 'vitest';
import { getAuthSecret, normalizeEmail } from '../auth';

describe('normalizeEmail', () => {
  it('trims and lowercases an email address', () => {
    expect(normalizeEmail('  Lee@YORK-Construction.ca  ')).toBe('lee@york-construction.ca');
  });
});

describe('getAuthSecret', () => {
  const originalEnv = process.env.AUTH_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalEnv;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('uses a development fallback when AUTH_SECRET is missing', () => {
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = 'development';

    const secret = getAuthSecret();

    expect(secret).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(secret)).toContain('dev-local-auth-secret');
  });
});
