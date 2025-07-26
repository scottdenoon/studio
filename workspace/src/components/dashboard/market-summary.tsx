
"use client";

import { useState, useEffect, useCallback } from 'react';
import { summarizeMarketTrends, SummarizeMarketTrendsOutput } from '@/ai/flows/summarize-market-trends';
import { summarizeMomentumTrends, SummarizeMomentumTrendsOutput } from '@/ai/flows/summarize-momentum-trends';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { getNewsFeed } from '@/app/actions';

type SummaryOutput = SummarizeMarketTrendsOutput | SummarizeMomentumTrendsOutput;

interface AiBriefingProps {
    open: boolean;
}

export default function AiBriefing({ open }: AiBriefingProps) {
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(false);
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
    // Only fetch summary if the dialog is open and it hasn't been fetched yet.
    if (open && !summary && !loading) {
      handleSummarize(summaryType);
    }
  }, [open, summary, loading, handleSummarize, summaryType]);


  return (
    <>
        <DialogHeader>
            <DialogTitle className="text-2xl">AI Market Briefing</DialogTitle>
            <DialogDescription>
              AI-powered analysis of market trends and momentum. 
              {lastUpdated && (
                  <span className='ml-2 text-xs text-muted-foreground'>
                      (Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
              )}
            </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md my-4">
            <Button
                variant={summaryType === 'market' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSummaryTypeChange('market')}
                className="flex-1"
            >
                <TrendingUp className="h-4 w-4 mr-2" />
                Market
            </Button>
            <Button
                variant={summaryType === 'momentum' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSummaryTypeChange('momentum')}
                className="flex-1"
            >
                <Zap className="h-4 w-4 mr-2" />
                Momentum
            </Button>
        </div>
      
        <div className="pt-2 min-h-[12rem] flex flex-col justify-center">
          {loading && (
             <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin"/>
                <span>Analyzing market data...</span>
             </div>
          )}
          {summary && !loading && (
              <div className="space-y-2 text-sm text-foreground/90">
                <p>{summary.summary}</p>
              </div>
          )}
          {error && !loading && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p><span className="font-semibold">Analysis Failed:</span> {error}</p>
              </div>
          )}
        </div>
    </>
  );
}
