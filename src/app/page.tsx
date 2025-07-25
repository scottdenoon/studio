
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import Watchlist from '@/components/dashboard/watchlist';
import AiBriefing from '@/components/dashboard/market-summary';
import RealtimeNewsFeed from '@/components/dashboard/realtime-news-feed';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isBriefingOpen, setBriefingOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-8 w-24" />
                    <div className="relative ml-auto flex-1 md:grow-0">
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Skeleton className="h-32 w-full" />
                    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-96 w-full" />
                        </div>
                        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
            <div className='grid gap-4 md:grid-cols-2'>
                <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Real-time Scanners</h2>
                        <p className="text-muted-foreground">Discover breaking stocks that meet your custom criteria.</p>
                    </div>
                    <Button asChild className="mt-4 self-start">
                        <Link href="/scanners">
                            View Scanners <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                 <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Trade Journal</h2>
                        <p className="text-muted-foreground">Log and review your trading activity to improve performance.</p>
                    </div>
                    <Button asChild className="mt-4 self-start">
                        <Link href="/journal">
                            Open Journal <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RealtimeNewsFeed />
              </div>
              <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Watchlist />
              </div>
            </div>
          </div>
        </main>
      </div>
      <Dialog open={isBriefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent>
          <AiBriefing open={isBriefingOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
