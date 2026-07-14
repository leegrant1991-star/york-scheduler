const STYLES: Record<string, string> = {
  DRAFT: 'bg-white/10 text-york-gray',
  ACTIVE: 'bg-york-gold-muted text-york-gold',
  COMPLETED: 'bg-york-success/15 text-york-success',
  ARCHIVED: 'bg-white/5 text-york-muted',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        STYLES[status] ?? STYLES.DRAFT
      }`}
    >
      {status}
    </span>
  );
}
