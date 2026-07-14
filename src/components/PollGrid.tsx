'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PollCard, { type PollCardData } from './PollCard';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function PollGrid({
  polls,
  emptyMessage = 'No polls here yet.',
}: {
  polls: PollCardData[];
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/poll/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  }

  async function duplicate(slug: string) {
    setBusySlug(slug);
    try {
      const res = await fetch(`/api/polls/${slug}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/polls/${data.poll.slug}`);
    } finally {
      setBusySlug(null);
    }
  }

  async function toggleArchive(poll: PollCardData) {
    setBusySlug(poll.slug);
    try {
      const nextStatus = poll.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
      const res = await fetch(`/api/polls/${poll.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusySlug(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusySlug(pendingDelete);
    try {
      const res = await fetch(`/api/polls/${pendingDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setPendingDelete(null);
        router.refresh();
      }
    } finally {
      setBusySlug(null);
    }
  }

  if (polls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-york-border-strong p-12 text-center">
        <p className="text-york-muted">{emptyMessage}</p>
        <Link href="/dashboard/polls/new" className="mt-3 inline-block font-semibold text-york-gold">
          Create a poll →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll, i) => (
          <PollCard
            key={poll.slug}
            poll={poll}
            index={i}
            busy={busySlug === poll.slug}
            copied={copiedSlug === poll.slug}
            onCopyLink={() => copyLink(poll.slug)}
            onDuplicate={() => duplicate(poll.slug)}
            onToggleArchive={() => toggleArchive(poll)}
            onDelete={() => setPendingDelete(poll.slug)}
          />
        ))}
      </div>

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete this poll?">
        <p className="text-sm text-york-gray">
          This permanently deletes the poll and every response submitted to it. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="tertiary" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={busySlug === pendingDelete} onClick={confirmDelete}>
            Delete poll
          </Button>
        </div>
      </Modal>
    </>
  );
}
