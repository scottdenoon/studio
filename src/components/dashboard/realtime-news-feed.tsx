
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Newspaper, ChevronDown, TrendingUp, BarChart2, Users, FileText, Bot, Loader2, AlertTriangle, Minus, TrendingDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getNewsFeed, getMarketDataConfig } from "@/app/actions";
import { NewsItem, MarketDataField } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStockData } from "@/services/market-data";
import { Separator } from "../ui/separator";


const MomentumIndicator = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 mr-2 text-accent" />
        <span className="font-medium">{label}:</span>
        <span className="ml-auto font-mono text-foreground">{value}</span>
    </div>
);

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

export default function RealtimeNewsFeed() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [marketDataConfig, setMarketDataConfig] = useState<Record<string, boolean>>({});
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [loadingLiveData, setLoadingLiveData] = useState(false);
  const { toast } = useToast();

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

  const fetchInitialData = useCallback(async () => {
    setLoadingFeed(true);
    try {
        const [initialNewsItems, config] = await Promise.all([
            getNewsFeed(),
            getMarketDataConfig()
        ]);
        setNewsItems(initialNewsItems);
        setMarketDataConfig(config);
        if (initialNewsItems.length > 0) {
          setSelectedItem(initialNewsItems[0].id!);
          handleToggleItem(true, initialNewsItems[0].ticker);
        }
    } catch (error) {
        console.error("Error fetching news feed:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the news feed from the database.",
        })
    } finally {
        setLoadingFeed(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  const handleToggleItem = async (isOpen: boolean, ticker: string) => {
    if (isOpen && !liveData[ticker]) {
      setLoadingLiveData(true);
      const data = await fetchStockData({ ticker });
      setLiveData(prev => ({...prev, [ticker]: data}));
      setLoadingLiveData(false);
    }
  };

  const getTimestamp = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2">
                <Newspaper />
                Real-time News Feed
            </CardTitle>
            <CardDescription>
              Breaking market news with real-time AI momentum analysis.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
            {loadingFeed ? (
                 <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                 </div>
            ) : newsItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 border border-dashed rounded-lg h-[400px]">
                    <Newspaper className="h-10 w-10" />
                    <p className="text-sm font-medium">No News Items</p>
                    <p className="text-xs">There are no news articles in the feed. Add new articles from the <Link href="/admin/news" className="text-primary underline">Admin Console</Link>.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {newsItems.map((news) => (
                    <Collapsible key={news.id} onOpenChange={(isOpen) => {
                       setSelectedItem(isOpen ? news.id! : null);
                       handleToggleItem(isOpen, news.ticker);
                    }} open={selectedItem === news.id} className={cn(
                        "border rounded-lg transition-colors",
                        selectedItem === news.id 
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
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs text-muted-foreground">{getTimestamp(news.publishedDate)}</span>
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-3 pt-0">
                            <Separator className="mb-3" />
                            <p className="text-xs italic text-muted-foreground mb-4">{news.content}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                                {marketDataFields.filter(f => marketDataConfig[f.id]).map(field => {
                                    const data = liveData[news.ticker];
                                    const value = data ? (data[field.id] !== undefined ? data[field.id] : news.momentum[field.id as keyof typeof news.momentum]) : null;
                                    
                                    if (loadingLiveData && !data) {
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

                            <div className="flex flex-col gap-3 p-3 rounded-md bg-background/50 border text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-accent shrink-0"/>
                                        <h4 className="font-semibold">AI Sentiment Analysis</h4>
                                    </div>
                                    {news.analysis && <SentimentDisplay sentiment={news.analysis.sentiment} impactScore={news.analysis.impactScore} showText />}
                                </div>
                                {!news.analysis && <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-4 w-4 animate-spin"/><span>Analyzing momentum impact...</span></div>}
                                {news.analysis && (
                                    <p className="text-xs text-foreground/80 pl-7">{news.analysis.summary}</p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                    ))}
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
