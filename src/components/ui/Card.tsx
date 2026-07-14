interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  featured?: boolean;
}

/**
 * York card system. See YORK_DESIGN_SYSTEM.md §7.
 * - default: resting navy-card surface
 * - interactive: adds hover elevation/lift for clickable cards
 * - featured: larger radius/padding + gold accent bar, for hero content
 */
export default function Card({
  interactive = false,
  featured = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`relative border border-york-border bg-york-card shadow-york-sm ${
        featured ? 'rounded-xl p-8' : 'rounded-lg p-6'
      } ${
        interactive
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-york-border-strong hover:bg-york-card-hover hover:shadow-york-md'
          : ''
      } ${className}`}
      {...rest}
    >
      {featured && <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-york-gold" />}
      {children}
    </div>
  );
}
