export type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger';

const BASE_BUTTON_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-york-gold disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-york-gold text-york-navy hover:bg-york-gold-hover hover:shadow-york-gold disabled:hover:shadow-none',
  secondary:
    'bg-transparent text-white border border-york-border-strong hover:bg-white/5',
  tertiary: 'bg-transparent text-york-gray hover:text-white',
  danger: 'bg-transparent text-york-danger border border-york-danger/30 hover:bg-york-danger/10',
};

export const buttonClasses = (variant: Variant = 'secondary', className = '') =>
  `${BASE_BUTTON_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
