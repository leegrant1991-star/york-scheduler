import Link from 'next/link';
import { buttonClasses } from '@/components/ui/buttonClasses';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-york-navy">
      <section className="bg-york-grid-surface border-b border-york-border">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-extrabold tracking-tight text-white">YORK</span>
            <span className="font-display text-xs font-semibold tracking-[0.2em] text-york-gold">
              CENTRAL SCHEDULING
            </span>
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl">
            One link. Every consultant&apos;s availability. No accounts, ever.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-york-gray">
            The internal York Central tool for scheduling recurring coordination meetings with
            consultants, architects, and subcontractors — send a link, watch the availability
            matrix fill itself in.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/login" className={buttonClasses('primary', 'px-6 py-3 text-base')}>
              Sign in to your dashboard
            </Link>
            <a href="#how-it-works" className={buttonClasses('secondary', 'px-6 py-3 text-base')}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-2xl font-bold text-white">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <Step n="01" title="Create the poll" body="List candidate timeslots and the people you're coordinating with. Import names from a CSV if you've already got a contact list." />
          <Step n="02" title="Share one link" body="Consultants open the link, type their name, tick every time that works — no login, no app, no account." />
          <Step n="03" title="Get the best time" body="York Central ranks every slot by attendance and flags the recommended time, with ties handled automatically." />
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border-t-2 border-york-gold pt-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-york-muted">{n}</span>
      <h3 className="mt-2 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-york-gray">{body}</p>
    </div>
  );
}
