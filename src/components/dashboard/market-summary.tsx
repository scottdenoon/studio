"use client";

import { useState, useEffect, useCallback } from 'react';
import { summarizeMarketTrends, SummarizeMarketTrendsOutput } from '@/ai/flows/summarize-market-trends';
import { summarizeMomentumTrends, SummarizeMomentumTrendsOutput } from '@/ai/flows/summarize-momentum-trends';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '../ui/separator';

type SummaryOutput = SummarizeMarketTrendsOutput | SummarizeMomentumTrendsOutput;

export default function MarketSummary() {
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState('market');
  const { toast } = useToast();

  const handleSummarize = useCallback(async () => {
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
      if (summaryType === 'market') {
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
  }, [summaryType, toast]);

  useEffect(() => {
    handleSummarize();
    const intervalId = setInterval(handleSummarize, 3600000); // 1 hour

    return () => clearInterval(intervalId);
  }, [handleSummarize]);


  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>AI Market Briefing</CardTitle>
        <CardDescription className="text-sm">
          Briefing automatically updates every hour. Select a briefing type below.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs value={summaryType} onValueChange={setSummaryType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market"><TrendingUp className="mr-2 h-4 w-4"/> Market</TabsTrigger>
                <TabsTrigger value="momentum"><Zap className="mr-2 h-4 w-4"/> Momentum</TabsTrigger>
            </TabsList>
        </Tabs>
      </CardContent>
      {(loading || summary || error) && (
        <CardContent className="pt-4">
            <Separator className="mb-4" />
          {loading && (
             <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Analyzing...</span>
             </div>
          )}
          {summary && !loading && (
              <div className="space-y-2">
                <h3 className="font-semibold text-base">
                    {summaryType === 'market' ? 'Market Trend Analysis' : 'Momentum Analysis'}
                </h3>
                <p className="text-sm text-foreground/80">{summary.summary}</p>
              </div>
          )}
          {error && !loading && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p><span className="font-semibold">Analysis Failed:</span> {error}</p>
              </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
