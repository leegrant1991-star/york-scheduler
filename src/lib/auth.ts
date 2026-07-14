import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'sitesync_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_AUTH_SECRET = 'dev-local-auth-secret-change-me';

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode(DEV_AUTH_SECRET);
  }

  throw new Error(
    'AUTH_SECRET is missing or too short. Set a long random value in your environment.'
  );
}

function getSecretKey() {
  return getAuthSecret();
}

export interface SessionPayload {
  adminId: string;
  email: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.adminId === 'string' && typeof payload.email === 'string') {
      return { adminId: payload.adminId, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

/** Sets the signed session cookie on the response for a logged-in admin. */
export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

/** Reads and verifies the current admin session from cookies, if any. */
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
