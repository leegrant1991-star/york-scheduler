'use client';

import { forwardRef } from 'react';
import { buttonClasses, type Variant } from './buttonClasses';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

/**
 * York button system — three visual tiers (plus a danger variant for
 * destructive actions). See YORK_DESIGN_SYSTEM.md §6.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', loading, disabled, className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClasses(variant, className)}
        {...rest}
      >
        {loading && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
