"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getNewsFeed, fetchStockDataAction, fetchStockHistoryAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StockChart } from '@/components/stock/stock-chart';
import { NewsItem } from '@/services/firestore';
import { StockData } from '@/lib/types';
import { format, subYears } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Newspaper, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AiBriefing from '@/components/dashboard/market-summary';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Link from 'next/link';

const SentimentDisplay = ({ sentiment, impactScore, showText = false }: { sentiment: string; impactScore: number, showText?: boolean }) => {
    const commonClasses = "text-xs";
    if (sentiment.toLowerCase() === 'positive') {
      return <Badge variant="default" className={cn(commonClasses, "bg-green-500 hover:bg-green-600")}><TrendingUp className={cn(showText && "mr-1", "h-3 w-3")} /> {showText && `Positive (${impactScore})`}</Badge>;
    }
    if (sentiment.toLowerCase() === 'negative') {
      return <Badge variant="destructive" className={cn(commonClasses)}><TrendingDown className={cn(showText && "mr-1", "h-3 w-3")} /> {showText && `Negative (${impactScore})`}</Badge>;
    }
    return <Badge variant="secondary" className={cn(commonClasses)}><Minus className={cn(showText && "mr-1", "h-3 w-3")} /> {showText && `Neutral (${impactScore})`}</Badge>;
};

export default function StockDetailPage({ params }: { params: { ticker: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const ticker = params.ticker.toUpperCase();

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBriefingOpen, setBriefingOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = subYears(to, 1);
      
      const [sData, allNews, hData] = await Promise.all([
        fetchStockDataAction({ ticker }),
        getNewsFeed(),
        fetchStockHistoryAction({ ticker, from: from.toISOString(), to: to.toISOString() })
      ]);
      
      setStockData(sData);
      setHistory(hData);

      const filteredNews = allNews.filter(item => item.ticker.toUpperCase() === ticker);
      setNews(filteredNews);

    } catch (error) {
      console.error("Error fetching stock details:", error);
      toast({ variant: "destructive", title: "Error", description: `Could not load data for ${ticker}.` });
    } finally {
      setLoading(false);
    }
  }, [ticker, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);
  
  const getTimestamp = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                        <div className="lg:col-span-1">
                             <Skeleton className="h-[500px] w-full" />
                        </div>
                    </div>
                </div>
            ) : stockData ? (
                 <div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">{stockData.name} <Badge variant="secondary">{stockData.ticker}</Badge></h1>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold">${stockData.price.toFixed(2)}</p>
                            <p className={cn("font-semibold", stockData.change >= 0 ? "text-green-500" : "text-red-500")}>
                                {stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Price History (1Y)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <StockChart data={history} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent News</CardTitle>
                                </CardHeader>
                                <CardContent>
                                {news.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">No recent news for {ticker}.</p>
                                ) : (
                                    <div className='space-y-4'>
                                    {news.map(item => (
                                        <div key={item.id} className="p-3 rounded-md border bg-background/50">
                                            <p className="font-semibold">{item.headline}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{item.content}</p>
                                            <Separator className="my-2" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{getTimestamp(item.publishedDate)}</span>
                                                {item.analysis ? (
                                                    <div className="flex items-center gap-2">
                                                        <Bot className="h-4 w-4 text-accent"/>
                                                        <p className='text-xs italic text-muted-foreground'>{item.analysis.summary}</p>
                                                        <SentimentDisplay sentiment={item.analysis.sentiment} impactScore={item.analysis.impactScore} />
                                                    </div>
                                                ) : <Loader2 className='h-4 w-4 animate-spin'/>}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Market Data</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Volume</span> <span className="font-mono">{stockData.volume.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Previous Close</span> <span className="font-mono">${(stockData.price - stockData.change).toFixed(2)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                 </div>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Stock Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Could not retrieve data for the ticker "{ticker}". It may be an invalid symbol.</p>
                        <Link href="/"><Button variant="link" className="px-0">Go back to Dashboard</Button></Link>
                    </CardContent>
                 </Card>
            )}
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
