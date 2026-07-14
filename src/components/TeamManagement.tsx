'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Field, inputClass } from './ui/Field';
import Card from './ui/Card';

export interface AdminRow {
  id: string;
  email: string;
  name: string | null;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  createdAt: string;
  invitedBy: { name: string | null; email: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-york-success/15 text-york-success',
  PENDING: 'bg-york-gold-muted text-york-gold',
  REVOKED: 'bg-white/5 text-york-muted',
};

export default function TeamManagement({
  initialAdmins,
  currentAdminId,
}: {
  initialAdmins: AdminRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<AdminRow | null>(null);

  async function refresh() {
    const res = await fetch('/api/admins');
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send invite.');
        return;
      }
      if (!data.emailSent) {
        setFallbackLink(data.acceptUrl);
      } else {
        setInviteOpen(false);
      }
      setName('');
      setEmail('');
      await refresh();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function revoke() {
    if (!pendingRevoke) return;
    setBusyId(pendingRevoke.id);
    try {
      const res = await fetch(`/api/admins/${pendingRevoke.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPendingRevoke(null);
        await refresh();
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Could not remove access.');
      }
    } finally {
      setBusyId(null);
    }
  }

  function closeInviteModal() {
    setInviteOpen(false);
    setFallbackLink(null);
    setError(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-white">Team</h2>
          <p className="mt-1 text-sm text-york-muted">Everyone with dashboard access.</p>
        </div>
        <Button variant="primary" onClick={() => setInviteOpen(true)}>
          + Invite teammate
        </Button>
      </div>

      <Card className="mt-4 !p-0">
        <ul className="divide-y divide-york-border">
          {admins.map((admin) => (
            <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{admin.name || admin.email}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[admin.status]}`}
                  >
                    {admin.status}
                  </span>
                  {admin.id === currentAdminId && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-york-muted">You</span>
                  )}
                </div>
                <div className="text-xs text-york-muted">
                  {admin.email}
                  {admin.invitedBy && ` · invited by ${admin.invitedBy.name || admin.invitedBy.email}`}
                </div>
              </div>
              {admin.id !== currentAdminId && admin.status !== 'REVOKED' && (
                <Button
                  variant="danger"
                  loading={busyId === admin.id}
                  onClick={() => setPendingRevoke(admin)}
                  className="!px-3 !py-1.5 text-xs"
                >
                  Remove access
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={inviteOpen} onClose={closeInviteModal} title="Invite a teammate">
        {fallbackLink ? (
          <div>
            <p className="text-sm text-york-gray">
              The invite was created, but no email provider is configured (see{' '}
              <code className="font-mono text-york-gold">EMAIL_PROVIDER</code> in your <code className="font-mono text-york-gold">.env</code>),
              so send this link to them directly instead:
            </p>
            <div className="mt-3 rounded-md border border-york-border bg-york-light px-3 py-2 text-sm text-york-gold break-all">
              {fallbackLink}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={closeInviteModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={sendInvite} className="space-y-4">
            <Field label="Name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-york-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="tertiary" onClick={closeInviteModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Send invite
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!pendingRevoke} onClose={() => setPendingRevoke(null)} title="Remove access?">
        <p className="text-sm text-york-gray">
          {pendingRevoke?.name || pendingRevoke?.email} will no longer be able to sign in. Their
          existing polls are kept, not deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="tertiary" onClick={() => setPendingRevoke(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={!!busyId} onClick={revoke}>
            Remove access
          </Button>
        </div>
      </Modal>
    </div>
  );
}
