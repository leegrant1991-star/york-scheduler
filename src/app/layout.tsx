import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
});
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'York Central — Scheduling',
  description:
    'Availability polling for York Construction and York Realty coordination meetings. One link, zero friction, no accounts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // York Dark Mode is the default and only theme for v1 — see
    // YORK_DESIGN_SYSTEM.md §14/§Dark mode.
    <html lang="en" className={`dark ${display.variable} ${body.variable}`}>
      <body className="bg-york-navy font-body text-york-white antialiased">{children}</body>
    </html>
  );
}
