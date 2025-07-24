"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { analyzeNewsSentiment, AnalyzeNewsSentimentOutput } from '@/ai/flows/analyze-news-sentiment';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Newspaper, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const newsAnalysisSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker is too long'),
  headline: z.string().min(10, 'Headline is too short').max(200, 'Headline is too long'),
  content: z.string().min(20, 'Content is too short').max(5000, 'Content is too long'),
});

type NewsAnalysisFormValues = z.infer<typeof newsAnalysisSchema>;

const SentimentDisplay = ({ sentiment, impactScore }: { sentiment: string; impactScore: number }) => {
  if (sentiment.toLowerCase() === 'positive') {
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><TrendingUp className="mr-1 h-4 w-4" /> Positive ({impactScore.toFixed(2)})</Badge>;
  }
  if (sentiment.toLowerCase() === 'negative') {
    return <Badge variant="destructive"><TrendingDown className="mr-1 h-4 w-4" /> Negative ({impactScore.toFixed(2)})</Badge>;
  }
  return <Badge variant="secondary"><Minus className="mr-1 h-4 w-4" /> Neutral ({impactScore.toFixed(2)})</Badge>;
};


export default function NewsAnalysis() {
  const [analysis, setAnalysis] = useState<AnalyzeNewsSentimentOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<NewsAnalysisFormValues>({
    resolver: zodResolver(newsAnalysisSchema),
    defaultValues: {
      ticker: "AAPL",
      headline: "Apple Unveils Breakthrough M4 Chip with Advanced AI Capabilities",
      content: "Today, Apple announced its next-generation M4 processor, promising significant performance boosts and dedicated hardware for on-device artificial intelligence. The new chip is expected to power the next lineup of Macs and iPads, potentially driving a new upgrade cycle for the tech giant.",
    },
  });

  const onSubmit = async (data: NewsAnalysisFormValues) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeNewsSentiment(data);
      setAnalysis(result);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Analyzing News",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI News Sentiment Analysis</CardTitle>
        <CardDescription>
          Analyze news articles to determine sentiment and potential impact on a stock's price.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AAPL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter news headline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste news article content here" {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Newspaper className="mr-2 h-4 w-4" />
                  Analyze News
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {(analysis || error) && (
        <CardFooter className="flex-col items-start gap-4">
          <Separator />
          {analysis && (
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Analysis Result</h3>
                <SentimentDisplay sentiment={analysis.sentiment} impactScore={analysis.impactScore} />
              </div>
              <p className="text-sm text-foreground/80">{analysis.summary}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-4 w-full">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-semibold">Analysis Failed</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
