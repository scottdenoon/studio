'use client';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import Watchlist from '@/components/dashboard/watchlist';
import MarketSummary from '@/components/dashboard/market-summary';
import RealtimeNewsFeed from '@/components/dashboard/realtime-news-feed';

export default function DashboardPage() {
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
