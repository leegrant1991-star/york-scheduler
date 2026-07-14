/**
 * Verifies a Cloudflare Turnstile token server-side. Swap the verify URL
 * if you use hCaptcha/reCAPTCHA instead — the request/response shape is
 * nearly identical across providers.
 */
export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.CAPTCHA_SECRET_KEY;
  if (!secret) return true; // CAPTCHA not configured — don't block submissions.
  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[captcha] verification request failed', err);
    return false;
  }
}
