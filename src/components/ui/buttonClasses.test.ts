import { describe, expect, it } from 'vitest';
import { buttonClasses } from './buttonClasses';

describe('buttonClasses', () => {
  it('returns the primary button styling classes', () => {
    const classes = buttonClasses('primary');

    expect(classes).toContain('bg-york-gold');
    expect(classes).toContain('text-york-navy');
  });

  it('appends additional classes when provided', () => {
    const classes = buttonClasses('secondary', 'px-6 py-3 text-base');

    expect(classes).toContain('px-6');
    expect(classes).toContain('py-3');
    expect(classes).toContain('text-base');
  });
});
