
"use client";

import { useState, useEffect, useCallback } from 'react';
import { summarizeMarketTrends, SummarizeMarketTrendsOutput } from '@/ai/flows/summarize-market-trends';
import { summarizeMomentumTrends, SummarizeMomentumTrendsOutput } from '@/ai/flows/summarize-momentum-trends';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertTriangle, Zap, SlidersHorizontal } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { getNewsFeed, NewsItem } from '@/services/firestore';

type SummaryOutput = SummarizeMarketTrendsOutput | SummarizeMomentumTrendsOutput;

export default function MarketSummary() {
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState('market');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSummarize = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const newsItems = await getNewsFeed();
      
      let newsFeedString = "No news available.";
      if (newsItems.length > 0) {
        newsFeedString = newsItems
          .map(item => `Ticker: ${item.ticker}\nHeadline: ${item.headline}\nContent: ${item.content}`)
          .join('\n\n---\n\n');
      }

      let result;
      if (type === 'market') {
        result = await summarizeMarketTrends({ newsFeed: newsFeedString });
      } else {
        result = await summarizeMomentumTrends({ newsFeed: newsFeedString });
      }
      setSummary(result);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Generating Summary",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const handleSummaryTypeChange = (type: string) => {
      if (!type || type === summaryType) return;
      setSummaryType(type);
      handleSummarize(type);
  }

  useEffect(() => {
    handleSummarize(summaryType);
    const intervalId = setInterval(() => handleSummarize(summaryType), 3600000); // 1 hour

    return () => clearInterval(intervalId);
  }, [handleSummarize, summaryType]);


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-2xl">AI Market Briefing</CardTitle>
            <CardDescription className="flex items-center text-sm">
              AI-powered analysis of market trends and momentum. 
              {lastUpdated && (
                  <span className='ml-2 text-xs text-muted-foreground'>
                      (Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
                variant={summaryType === 'market' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSummaryTypeChange('market')}
                className={cn("h-auto px-3 py-1", summaryType === 'market' && 'bg-background text-foreground shadow-sm')}
            >
                <TrendingUp className="h-4 w-4 mr-2" />
                Market
            </Button>
            <Button
                variant={summaryType === 'momentum' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSummaryTypeChange('momentum')}
                className={cn("h-auto px-3 py-1", summaryType === 'momentum' && 'bg-background text-foreground shadow-sm')}
            >
                <Zap className="h-4 w-4 mr-2" />
                Momentum
            </Button>
          </div>
      </CardHeader>
      
      <CardContent className="pt-2">
          <Separator className="mb-4" />
          {loading && (
             <div className="flex items-center gap-2 text-muted-foreground min-h-[4rem]">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Analyzing market data...</span>
             </div>
          )}
          {summary && !loading && (
              <div className="space-y-2 text-sm text-foreground/90 min-h-[4rem]">
                <p>{summary.summary}</p>
              </div>
          )}
          {error && !loading && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3 text-sm min-h-[4rem]">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p><span className="font-semibold">Analysis Failed:</span> {error}</p>
              </div>
          )}
      </CardContent>
    </Card>
  );
}
