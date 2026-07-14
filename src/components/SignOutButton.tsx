'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      }}
      className="text-sm font-medium text-york-muted hover:text-white"
    >
      Sign out
    </button>
  );
}
