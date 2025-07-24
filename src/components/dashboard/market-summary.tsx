"use client";

import { useState } from 'react';
import { summarizeMarketTrends, SummarizeMarketTrendsOutput } from '@/ai/flows/summarize-market-trends';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MarketSummary() {
  const [summary, setSummary] = useState<SummarizeMarketTrendsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    // In a real app, this would come from a live news feed API
    const mockNewsFeed = `
      - Market opens with strong gains, led by tech sector.
      - NASDAQ up 1.5%, Dow Jones Industrial Average up 0.8%.
      - ACME Corp (ACME) reports record earnings, stock jumps 12%.
      - Federal Reserve signals potential interest rate hikes, causing some market jitters.
      - Oil prices rise amid geopolitical tensions.
      - Retail sector shows weakness after poor monthly sales data.
    `;

    try {
      const result = await summarizeMarketTrends({ newsFeed: mockNewsFeed });
      setSummary(result);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Summarizing Market Trends",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="sm:col-span-4">
      <CardHeader className="pb-3">
        <CardTitle>AI Market Summary</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          Get a real-time, AI-powered summary of current market conditions and trends based on the latest news.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleSummarize} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
             <TrendingUp className="mr-2 h-4 w-4" />
             Generate Summary
            </>
          )}
        </Button>
      </CardFooter>
      {summary && (
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Market Trend Analysis</h3>
            <p className="text-sm text-foreground/80">{summary.summary}</p>
          </div>
        </CardContent>
      )}
      {error && (
        <CardContent>
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-4">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Analysis Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
