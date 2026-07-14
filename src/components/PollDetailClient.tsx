'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import ResultsMatrix from './ResultsMatrix';
import Button from './ui/Button';
import { buttonClasses } from './ui/buttonClasses';
import Modal from './ui/Modal';

interface Props {
  poll: { slug: string; title: string; description: string | null; status: string; cadence: string };
  timeslots: { id: string; startsAt: string; endsAt: string; label: string | null }[];
  tallies: any[];
  participants: { id: string; name: string; email: string | null; answers: Record<string, string> }[];
  invitations: { name: string; email: string; status: string }[];
}

export default function PollDetailClient({ poll, tallies, participants, invitations }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pollUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/poll/${poll.slug}` : `/poll/${poll.slug}`;

  async function copyLink() {
    await navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function sendInvites(mode: 'invite' | 'remind') {
    setBusy(mode);
    try {
      const res = await fetch(`/api/polls/${poll.slug}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(`Sent ${data.sent} email${data.sent === 1 ? '' : 's'}${data.failed ? `, ${data.failed} failed` : ''}.`);
        router.refresh();
      } else {
        setNotice(data.error ?? 'Could not send.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(status: string) {
    setBusy(status);
    try {
      await fetch(`/api/polls/${poll.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function duplicate() {
    setBusy('duplicate');
    try {
      const res = await fetch(`/api/polls/${poll.slug}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/polls/${data.poll.slug}`);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      const res = await fetch(`/api/polls/${poll.slug}`, { method: 'DELETE' });
      if (res.ok) router.push('/dashboard');
    } finally {
      setBusy(null);
      setConfirmingDelete(false);
    }
  }

  const respondedCount = participants.length;
  const expectedCount = invitations.length;

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">{poll.title}</h1>
            <StatusBadge status={poll.status} />
          </div>
          {poll.description && <p className="mt-1 max-w-xl text-sm text-york-muted">{poll.description}</p>}
          <p className="mt-2 text-sm text-york-muted">
            {respondedCount} of {expectedCount || respondedCount} responded
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy share link'}
          </Button>
          <Button variant="secondary" loading={busy === 'invite'} onClick={() => sendInvites('invite')}>
            Send invites
          </Button>
          <Button variant="secondary" loading={busy === 'remind'} onClick={() => sendInvites('remind')}>
            Send reminders
          </Button>
          <a href={`/api/export/${poll.slug}/csv`} className={buttonClasses('secondary')}>
            Export CSV
          </a>
          <a href={`/api/export/${poll.slug}/pdf`} className={buttonClasses('secondary')}>
            Export PDF
          </a>
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="secondary" loading={busy === 'duplicate'} onClick={duplicate}>
            Duplicate
          </Button>
          {poll.status !== 'ARCHIVED' ? (
            <Button variant="secondary" disabled={!!busy} onClick={() => setStatus('ARCHIVED')}>
              Archive
            </Button>
          ) : (
            <Button variant="secondary" disabled={!!busy} onClick={() => setStatus('ACTIVE')}>
              Reactivate
            </Button>
          )}
          <Button variant="danger" disabled={!!busy} onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {notice && <p className="mt-3 text-sm text-york-gold no-print">{notice}</p>}

      <div className="mt-4 rounded-md border border-york-border bg-york-card px-4 py-2 text-sm text-york-gray no-print">
        Share link: <span className="font-mono text-york-gold">{pollUrl}</span>
      </div>

      <div className="mt-6">
        <ResultsMatrix tallies={tallies} participants={participants} />
      </div>

      {invitations.length > 0 && (
        <div className="mt-8 no-print">
          <h2 className="font-display text-base font-bold text-white">Invitations</h2>
          <ul className="mt-3 divide-y divide-york-border rounded-lg border border-york-border bg-york-card">
            {invitations.map((inv) => (
              <li key={inv.email} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-white">
                  {inv.name} <span className="text-york-muted">— {inv.email}</span>
                </span>
                <span className="text-xs font-semibold uppercase text-york-muted">{inv.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title="Delete this poll?">
        <p className="text-sm text-york-gray">
          This permanently deletes the poll and every response submitted to it. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="tertiary" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy === 'delete'} onClick={remove}>
            Delete poll
          </Button>
        </div>
      </Modal>
    </div>
  );
}
