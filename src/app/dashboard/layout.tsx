import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import Header from '@/components/Header';
import SecondaryNav from '@/components/SecondaryNav';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');

  return (
    <div className="min-h-screen bg-york-navy">
      <Header />
      <SecondaryNav />
      <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-4 px-4 py-2 text-xs sm:px-8">
        <Link href="/dashboard/polls/new" className="font-semibold text-york-gold hover:text-york-gold-hover">
          + New poll
        </Link>
        <span className="text-york-muted">{admin.email}</span>
        <SignOutButton />
      </div>
      <main className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-8">{children}</main>
    </div>
  );
}
