import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import AvailabilityForm from '@/components/AvailabilityForm';

export const dynamic = 'force-dynamic';

export default async function PublicPollPage({ params }: { params: { slug: string } }) {
  const poll = await prisma.poll.findUnique({
    where: { slug: params.slug },
    select: { id: true, title: true },
  });

  if (!poll) notFound();

  return (
    <div className="min-h-screen bg-york-navy pb-16">
      <div className="bg-york-grid-surface border-b border-york-border px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-extrabold tracking-tight text-white">YORK</span>
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-york-gold">
              CONSTRUCTION
            </span>
          </div>
          <p className="mt-6 font-display text-xs uppercase tracking-[0.2em] text-york-gold">
            Availability poll
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{poll.title}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6">
        <AvailabilityForm slug={params.slug} />
      </div>
    </div>
  );
}
