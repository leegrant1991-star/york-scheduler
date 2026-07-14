'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import Card from '@/components/ui/Card';

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admins/accept-invite?token=${params.token}`)
      .then((res) => res.json())
      .then((data) => {
        setValid(!!data.valid);
        if (data.email) setEmail(data.email);
      })
      .finally(() => setChecking(false));
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admins/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not accept this invite.');
        return;
      }
      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-york-grid-surface">
        <p className="text-york-muted">Checking your invite…</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-york-grid-surface px-6">
        <Card className="max-w-sm text-center">
          <h1 className="font-display text-lg font-bold text-white">Invite not valid</h1>
          <p className="mt-2 text-sm text-york-muted">
            This invite link has expired or was already used. Ask a teammate to send you a new one
            from Administration → Team.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-york-grid-surface px-6">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-white">YORK</span>
          <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-york-gold">CENTRAL</span>
        </div>
        <h1 className="mt-6 text-center font-display text-xl font-bold text-white">Set up your account</h1>
        <p className="mt-1 text-center text-sm text-york-muted">{email}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Your name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-york-danger">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            Create account
          </Button>
        </form>
      </Card>
    </div>
  );
}
