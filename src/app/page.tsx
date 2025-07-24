import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import RealtimeChart from '@/components/dashboard/realtime-chart';
import Watchlist from '@/components/dashboard/watchlist';
import MarketSummary from '@/components/dashboard/market-summary';
import NewsAnalysis from '@/components/dashboard/news-analysis';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <MarketSummary />
            </div>
            <RealtimeChart />
            <NewsAnalysis />
          </div>
          <div>
            <Watchlist />
          </div>
        </main>
      </div>
    </div>
  );
}
