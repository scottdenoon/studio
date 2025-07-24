'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import Watchlist from '@/components/dashboard/watchlist';
import MarketSummary from '@/components/dashboard/market-summary';
import RealtimeNewsFeed from '@/components/dashboard/realtime-news-feed';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
            <MarketSummary />
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
    </div>
  );
}
