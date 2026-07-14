export function Field({
  label,
  children,
  className = '',
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-york-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-york-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-york-border bg-york-light px-3.5 py-2.5 text-sm text-white placeholder:text-york-muted focus:border-york-gold focus:outline-none focus:ring-1 focus:ring-york-gold/40';

export const checkboxClass =
  'h-4 w-4 rounded border-york-border-strong bg-york-light text-york-gold focus:ring-york-gold/40';
