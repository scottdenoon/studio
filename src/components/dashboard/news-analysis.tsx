"use client";

import { useState, useEffect } from 'react';
import { AnalyzeNewsSentimentOutput } from '@/ai/flows/analyze-news-sentiment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface NewsAnalysisProps {
  selectedNews: AnalyzeNewsSentimentOutput | null;
}

const SentimentDisplay = ({ sentiment, impactScore }: { sentiment: string; impactScore: number }) => {
  if (sentiment.toLowerCase() === 'positive') {
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><TrendingUp className="mr-1 h-4 w-4" /> Positive ({impactScore})</Badge>;
  }
  if (sentiment.toLowerCase() === 'negative') {
    return <Badge variant="destructive"><TrendingDown className="mr-1 h-4 w-4" /> Negative ({impactScore})</Badge>;
  }
  return <Badge variant="secondary"><Minus className="mr-1 h-4 w-4" /> Neutral ({impactScore})</Badge>;
};


export default function NewsAnalysis({ selectedNews }: NewsAnalysisProps) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI News Sentiment Analysis</CardTitle>
        <CardDescription>
          Click a story from the feed to see the detailed AI analysis here.
        </CardDescription>
      </CardHeader>
        {selectedNews ? (
             <CardContent className="space-y-4 w-full">
                <Separator />
                <div className="flex justify-between items-center pt-4">
                    <h3 className="font-semibold text-lg">Analysis Result</h3>
                    <SentimentDisplay sentiment={selectedNews.sentiment} impactScore={selectedNews.impactScore} />
                </div>
                <p className="text-sm text-foreground/80">{selectedNews.summary}</p>
             </CardContent>
        ) : (
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 border border-dashed rounded-lg">
                    <Bot className="h-10 w-10" />
                    <p className="text-sm">No news item selected. Click on an article in the feed to view its detailed AI analysis.</p>
                </div>
            </CardContent>
        )}
    </Card>
  );
}
