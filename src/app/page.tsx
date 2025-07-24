'use client';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import Watchlist from '@/components/dashboard/watchlist';
import MarketSummary from '@/components/dashboard/market-summary';
import NewsAnalysis from '@/components/dashboard/news-analysis';
import RealtimeNewsFeed from '@/components/dashboard/realtime-news-feed';
import { useState } from 'react';
import { AnalyzeNewsSentimentOutput } from '@/ai/flows/analyze-news-sentiment';
import DashboardGrid from '@/components/dashboard/dashboard-grid';

export default function DashboardPage() {
  const [selectedNews, setSelectedNews] = useState<AnalyzeNewsSentimentOutput | null>(null);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <DashboardGrid>
             <div key="market-summary">
                <MarketSummary />
             </div>
             <div key="realtime-news-feed">
                <RealtimeNewsFeed onSelectNews={setSelectedNews} />
             </div>
             <div key="news-analysis">
                <NewsAnalysis selectedNews={selectedNews} />
             </div>
             <div key="watchlist">
                <Watchlist />
             </div>
          </DashboardGrid>
        </main>
      </div>
    </div>
  );
}
