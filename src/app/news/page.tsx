
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getNewsFeed, NewsItem, getMarketDataConfig } from '@/services/firestore';
import { getNewsSources } from '@/app/admin/news/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Newspaper, Search, Bot, Loader2, TrendingUp, TrendingDown, Minus, ChevronDown, BarChart2, Users, FileText, Wifi, WifiOff, List, Rows3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AiBriefing from '@/components/dashboard/market-summary';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fetchStockData } from '@/services/market-data';
import { MarketDataField } from '@/services/firestore';


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

const MomentumIndicator = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 mr-2 text-accent" />
        <span className="font-medium">{label}:</span>
        <span className="ml-auto font-mono text-foreground">{value}</span>
    </div>
);


export default function NewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerFilter, setTickerFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState< 'closed' | 'connecting' | 'open'>('closed');
  const [isBriefingOpen, setBriefingOpen] = useState(false);
  const [view, setView] = useState<'detailed' | 'compact'>('detailed');
  const [marketDataConfig, setMarketDataConfig] = useState<Record<string, boolean>>({});
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [loadingLiveData, setLoadingLiveData] = useState(false);

  const marketDataFields: Omit<MarketDataField, 'defaultEnabled'>[] = [
    { id: 'price', label: 'Price', description: 'Latest closing price.' },
    { id: 'change', label: 'Change ($)', description: 'Price change from previous day.' },
    { id: 'changePercent', label: 'Change (%)', description: 'Percentage price change.' },
    { id: 'volume', label: 'Volume', description: 'Trading volume for the day.' },
    { id: 'relativeVolume', label: 'Relative Volume', description: 'Volume compared to average.' },
    { id: 'float', label: 'Float', description: 'Shares available for trading.' },
    { id: 'shortInterest', label: 'Short Interest', description: 'Percentage of shares held short.' },
    { id: 'priceAction', label: 'Price Action', description: 'Description of recent price movement.' },
  ];

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const [news, config] = await Promise.all([
        getNewsFeed(),
        getMarketDataConfig(),
      ]);
      setNewsItems(news);
      setMarketDataConfig(config);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load news feed.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    } 
    if (user) {
      fetchNews();

      const connectWebSocket = async () => {
        const sources = await getNewsSources();
        const wsSource = sources.find(s => s.isActive && s.type === 'WebSocket');
        
        if (!wsSource) {
            return;
        }

        setWsStatus('connecting');
        const wsUrl = `/api/websocket-news?url=${encodeURIComponent(wsSource.url)}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => setWsStatus('open');
        socket.onclose = () => setWsStatus('closed');
        socket.onerror = (err) => {
            console.error("WebSocket Error:", err);
            setWsStatus('closed');
        };

        socket.onmessage = (event) => {
            try {
                const newItem: NewsItem = JSON.parse(event.data);
                // Add a temporary unique ID for rendering
                newItem.id = `ws-${new Date().getTime()}`;
                setNewsItems(prev => [newItem, ...prev]);
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        return () => {
            if (socket.readyState === 1) { // <-- This is important
                socket.close();
            }
        };
      };

      const cleanup = connectWebSocket();
      return () => {
          cleanup.then(fn => fn && fn());
      }
    }
  }, [user, authLoading, router, fetchNews]);

  const filteredNews = useMemo(() => {
    return newsItems
      .filter(item => {
        const tickerMatch = tickerFilter ? item.ticker.toLowerCase().includes(tickerFilter.toLowerCase()) : true;
        const sentimentMatch = sentimentFilter !== 'all' ? (item.analysis?.sentiment.toLowerCase() === sentimentFilter) : true;
        return tickerMatch && sentimentMatch;
      });
  }, [newsItems, tickerFilter, sentimentFilter]);
  
   const handleToggleItem = async (isOpen: boolean, ticker: string) => {
    if (isOpen) {
      setLoadingLiveData(true);
      const data = await fetchStockData({ ticker });
      setLiveData(prev => ({...prev, [ticker]: data}));
      setLoadingLiveData(false);
    }
  };
  
  const getTimestamp = (dateString: string, withDate = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (withDate) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (authLoading || !user) {
    // Show a skeleton loader while auth state is resolving
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <div className='flex gap-4 mb-6'>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
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
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className='mb-6'>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">News & Analysis</h1>
                <p className="text-muted-foreground">Browse and filter the latest market-moving news with AI insights.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by ticker..."
                                value={tickerFilter}
                                onChange={(e) => setTickerFilter(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by sentiment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sentiments</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                        </Select>
                         <ToggleGroup type="single" value={view} onValueChange={(value) => { if (value) setView(value as 'detailed' | 'compact')}} size="sm">
                            <ToggleGroupItem value="detailed" aria-label="Detailed view"><Rows3 /></ToggleGroupItem>
                            <ToggleGroupItem value="compact" aria-label="Compact view"><List /></ToggleGroupItem>
                        </ToggleGroup>
                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                            {wsStatus === 'connecting' && <><Loader2 className="h-4 w-4 animate-spin" /><span>Connecting...</span></>}
                            {wsStatus === 'open' && <><Wifi className="h-4 w-4 text-green-500" /><span>Live</span></>}
                            {wsStatus === 'closed' && <><WifiOff className="h-4 w-4" /><span>Offline</span></>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[65vh]">
                        {loading ? (
                             <div className="space-y-2 pr-4">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                             </div>
                        ) : filteredNews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 border border-dashed rounded-lg h-[400px]">
                                <Newspaper className="h-10 w-10" />
                                <p className="text-sm font-medium">No Matching News</p>
                                <p className="text-xs">
                                    {newsItems.length === 0
                                        ? <>No news in the feed. Add sources from the <Link href="/admin/news" className="text-primary underline">Admin Console</Link>.</>
                                        : "Try adjusting your filters to find what you're looking for."
                                    }
                                </p>
                            </div>
                        ) : view === 'detailed' ? (
                             <div className="space-y-3 pr-4">
                                {filteredNews.map((news) => (
                                    <Collapsible key={news.id} onOpenChange={(isOpen) => {
                                      setOpenItemId(isOpen ? news.id! : null);
                                      handleToggleItem(isOpen, news.ticker);
                                    }} open={openItemId === news.id} className={cn(
                                        "border rounded-lg transition-colors",
                                        openItemId === news.id 
                                            ? "bg-muted border-primary" 
                                            : "hover:bg-muted/50"
                                    )}>
                                        <CollapsibleTrigger className="w-full p-3 text-left group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant="outline" className="text-base py-1 px-3">{news.ticker}</Badge>
                                                        {news.analysis ? (
                                                            <SentimentDisplay sentiment={news.analysis.sentiment} impactScore={news.analysis.impactScore} />
                                                        ) : (
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <p className="font-semibold leading-snug flex-1 pt-1">{news.headline}</p>
                                                </div>
                                                <div className="flex items-center gap-3 pt-1">
                                                    <span className="text-xs text-muted-foreground">{getTimestamp(news.publishedDate)}</span>
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="p-3 pt-0">
                                            <Separator className="mb-3" />
                                            <p className="text-sm italic text-muted-foreground mb-4">{news.content}</p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                                                 {marketDataFields.filter(f => marketDataConfig[f.id]).map(field => {
                                                    const data = liveData[news.ticker];
                                                    const value = data ? (data[field.id] !== undefined ? data[field.id] : news.momentum[field.id as keyof typeof news.momentum]) : null;
                                                    
                                                    if (loadingLiveData) {
                                                      return <Skeleton key={field.id} className="h-5 w-full" />
                                                    }
                                                    return (
                                                      <MomentumIndicator 
                                                        key={field.id} 
                                                        icon={BarChart2} 
                                                        label={field.label} 
                                                        value={value !== null ? (typeof value === 'number' ? value.toFixed(2) : value) : "N/A"}
                                                      />
                                                    )
                                                 })}
                                            </div>

                                            {news.analysis ? (
                                                <div className="flex flex-col gap-3 p-3 rounded-md bg-background/50 border text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Bot className="h-5 w-5 text-accent shrink-0"/>
                                                            <h4 className="font-semibold">AI Sentiment Analysis</h4>
                                                        </div>
                                                        <SentimentDisplay sentiment={news.analysis.sentiment} impactScore={news.analysis.impactScore} showText />
                                                    </div>
                                                    <p className="text-sm text-foreground/80 pl-7">{news.analysis.summary}</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 rounded-md bg-background/50 border">
                                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                                    <span>Analyzing momentum impact...</span>
                                                </div>
                                            )}
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[90px]">Time</TableHead>
                                        <TableHead className="w-[80px]">Ticker</TableHead>
                                        <TableHead>Headline</TableHead>
                                        <TableHead className="w-[150px]">AI Sentiment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNews.map(news => (
                                        <TableRow key={news.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpenItemId(openItemId === news.id ? null : news.id!)}>
                                            <TableCell className="text-xs text-muted-foreground">{getTimestamp(news.publishedDate)}</TableCell>
                                            <TableCell><Badge variant="outline">{news.ticker}</Badge></TableCell>
                                            <TableCell className="font-medium text-sm">{news.headline}</TableCell>
                                            <TableCell>
                                                {news.analysis ? (
                                                     <SentimentDisplay sentiment={news.analysis.sentiment} impactScore={news.analysis.impactScore} showText />
                                                ) : (
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                                        <span>Analyzing...</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
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
