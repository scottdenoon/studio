
"use client";

import { useState, useEffect, useCallback } from 'react';
import { summarizeMarketTrends, SummarizeMarketTrendsOutput } from '@/ai/flows/summarize-market-trends';
import { summarizeMomentumTrends, SummarizeMomentumTrendsOutput } from '@/ai/flows/summarize-momentum-trends';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertTriangle, Zap, SlidersHorizontal } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

type SummaryOutput = SummarizeMarketTrendsOutput | SummarizeMomentumTrendsOutput;

export default function MarketSummary() {
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState('market');
  const [showControls, setShowControls] = useState(true);
  const { toast } = useToast();

  const handleSummarize = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    // In a real app, this would come from a live news feed API
    const mockNewsFeed = `
      - Market opens with strong gains, led by tech sector.
      - NASDAQ up 1.5%, Dow Jones Industrial Average up 0.8%.
      - ACME Corp (ACME) reports record earnings, stock jumps 12% on high volume.
      - Federal Reserve signals potential interest rate hikes, causing some market jitters.
      - Oil prices rise amid geopolitical tensions.
      - Retail sector shows weakness after poor monthly sales data.
      - Widget Co (WIDG) down 5% after competitor announcement.
      - Innovate Inc (INVT) surges 20% on buyout rumors.
    `;

    try {
      let result;
      if (type === 'market') {
        result = await summarizeMarketTrends({ newsFeed: mockNewsFeed });
      } else {
        result = await summarizeMomentumTrends({ newsFeed: mockNewsFeed });
      }
      setSummary(result);
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
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-2xl">AI Market Briefing</CardTitle>
            <CardDescription className="text-sm">
              Hourly AI-powered analysis of market trends and momentum.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup 
                type="single" 
                value={summaryType} 
                onValueChange={handleSummaryTypeChange}
                className={cn("transition-opacity", !showControls && "opacity-0 pointer-events-none")}
            >
                <ToggleGroupItem value="market" aria-label="Toggle Market View">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Market
                </ToggleGroupItem>
                <ToggleGroupItem value="momentum" aria-label="Toggle Momentum View">
                    <Zap className="h-4 w-4 mr-2" />
                    Momentum
                </ToggleGroupItem>
            </ToggleGroup>

            <Button variant="ghost" size="icon" onClick={() => setShowControls(!showControls)}>
                <SlidersHorizontal className="h-4 w-4"/>
                <span className="sr-only">Toggle Controls</span>
            </Button>
          </div>
      </CardHeader>
      
      <CardContent className="pt-2">
          <Separator className="mb-4" />
          {loading && (
             <div className="flex items-center gap-2 text-muted-foreground h-16">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Analyzing market data...</span>
             </div>
          )}
          {summary && !loading && (
              <div className="space-y-2 text-sm text-foreground/90 h-16">
                <p>{summary.summary}</p>
              </div>
          )}
          {error && !loading && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3 text-sm h-16">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p><span className="font-semibold">Analysis Failed:</span> {error}</p>
              </div>
          )}
      </CardContent>
    </Card>
  );
}
