'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const ITEMS = [
  { href: '/dashboard', label: 'Active Polls' },
  { href: '/dashboard/upcoming', label: 'Upcoming Meetings' },
  { href: '/dashboard/completed', label: 'Completed Polls' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/administration', label: 'Administration' },
];

export default function SecondaryNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-york-border bg-york-light">
      <div className="york-nav-scroll mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 sm:px-8">
        {ITEMS.map((item) => {
          const active =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                active ? 'text-york-gold' : 'text-york-gray hover:text-white'
              }`}
            >
              {item.label}
              {active && (
                <motion.span
                  layoutId="secondary-nav-underline"
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-york-gold"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
