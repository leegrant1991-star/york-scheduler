import PollWizard from '@/components/PollWizard';

export default function NewPollPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-2xl font-bold text-white">New poll</h1>
      <p className="mt-1 text-sm text-york-muted">
        Add candidate timeslots and the people you&apos;re coordinating with.
      </p>
      <div className="mt-8">
        <PollWizard />
      </div>
    </div>
  );
}
