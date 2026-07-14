'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import Button from './ui/Button';
import Card from './ui/Card';

export interface PollCardData {
  slug: string;
  title: string;
  status: string;
  cadence: string;
  participantCount: number;
  timeslotCount: number;
  inviteCount: number;
  updatedAt: string;
}

interface PollCardProps {
  poll: PollCardData;
  busy: boolean;
  copied: boolean;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  index?: number;
}

export default function PollCard({
  poll,
  busy,
  copied,
  onCopyLink,
  onDuplicate,
  onToggleArchive,
  onDelete,
  index = 0,
}: PollCardProps) {
  const expected = poll.inviteCount || poll.participantCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card interactive className="flex h-full flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/polls/${poll.slug}`}
              className="font-display text-lg font-bold text-white hover:text-york-gold"
            >
              {poll.title}
            </Link>
            <StatusBadge status={poll.status} />
          </div>
          <p className="mt-2 text-sm text-york-muted">
            {poll.timeslotCount} timeslots · {poll.participantCount}/{expected} responded
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onCopyLink} className="!px-3 !py-1.5 text-xs">
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onDuplicate} className="!px-3 !py-1.5 text-xs">
            Duplicate
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onToggleArchive} className="!px-3 !py-1.5 text-xs">
            {poll.status === 'ARCHIVED' ? 'Reactivate' : 'Archive'}
          </Button>
          <Button variant="danger" disabled={busy} onClick={onDelete} className="!px-3 !py-1.5 text-xs">
            Delete
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
