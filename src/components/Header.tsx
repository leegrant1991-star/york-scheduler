'use client';

import Link from 'next/link';

/**
 * Mirrors the York Central header structure: a single company mark on
 * each far edge with a large global search bar between them. No company
 * switcher, no filter pills — see YORK_DESIGN_SYSTEM.md §11.
 *
 * TODO(v2): wire the search input to a real command palette (polls,
 * meetings, consultants, participants) once there's a search index.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-york-border bg-york-navy">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-8">
        <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-2" aria-label="York Construction">
          <BrandMark subtitle="CONSTRUCTION" />
        </Link>

        <div className="mx-auto hidden w-full max-w-2xl flex-1 sm:block">
          <label className="relative block">
            <span className="sr-only">Search</span>
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-york-navy/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search polls, meetings, consultants, participants…"
              className="w-full rounded-full bg-white py-2.5 pl-11 pr-4 text-sm text-york-navy placeholder:text-york-navy/50 focus:outline-none focus:ring-2 focus:ring-york-gold/60"
            />
          </label>
        </div>

        {/* Mobile: icon-triggered search affordance in place of the full bar */}
        <button
          className="ml-auto rounded-md p-2 text-york-gray hover:text-white sm:hidden"
          aria-label="Search"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        <div className="hidden flex-shrink-0 items-center gap-2 sm:flex" aria-label="York Realty">
          <BrandMark subtitle="REALTY" align="right" />
        </div>
      </div>
    </header>
  );
}

function BrandMark({ subtitle, align = 'left' }: { subtitle: string; align?: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col leading-none ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="font-display text-lg font-extrabold tracking-tight text-white">YORK</span>
      <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-york-gold">
        {subtitle}
      </span>
    </div>
  );
}
