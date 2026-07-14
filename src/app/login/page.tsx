'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import Card from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Sign-in failed.');
        return;
      }
      router.push(params.get('next') ?? '/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-york-grid-surface px-6">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-white">YORK</span>
          <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-york-gold">CENTRAL</span>
        </div>
        <h1 className="mt-6 text-center font-display text-xl font-bold text-white">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-york-muted">York Central scheduling dashboard</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-york-danger">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
