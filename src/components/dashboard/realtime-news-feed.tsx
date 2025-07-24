"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyzeNewsSentimentInput } from "@/ai/flows/analyze-news-sentiment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Newspaper } from "lucide-react";

interface RealtimeNewsFeedProps {
  onSelectNews: (news: AnalyzeNewsSentimentInput) => void;
}

const mockNewsData: AnalyzeNewsSentimentInput[] = [
    {
        ticker: "TSLA",
        headline: "Tesla reports record Q4 deliveries, beating analyst expectations",
        content: "Tesla announced it delivered 484,507 vehicles in the fourth quarter and 1.81 million vehicles for the full year 2023, marking a 38% increase from the previous year. The results sent TSLA shares up 3% in pre-market trading.",
    },
    {
        ticker: "NVDA",
        headline: "NVIDIA unveils new AI chips for gaming and data centers",
        content: "NVIDIA today took the wraps off its latest generation of graphics processing units, the RTX 50 series, with major improvements in ray tracing and AI-powered DLSS technology. The company also revealed its new H200 data center GPU, aiming to continue its dominance in the AI hardware market.",
    },
    {
        ticker: "AAPL",
        headline: "Apple Vision Pro launch date set for February 2nd",
        content: "Apple has officially announced that its much-anticipated Vision Pro mixed-reality headset will be available in the U.S. starting February 2nd, with pre-orders beginning January 19th. The device is priced at $3,499.",
    },
    {
        ticker: "MSFT",
        headline: "Microsoft to acquire gaming giant Activision Blizzard for $68.7 billion",
        content: "In a landmark deal for the gaming industry, Microsoft has agreed to purchase Activision Blizzard, the publisher of major franchises like Call of Duty and World of Warcraft. The all-cash transaction is expected to close in 2024.",
    },
    {
        ticker: "JPM",
        headline: "JPMorgan Chase CEO Jamie Dimon warns of persistent inflation",
        content: "Jamie Dimon, CEO of JPMorgan Chase, stated in an interview that he believes inflationary pressures could be more persistent than the market currently expects, citing strong consumer demand and geopolitical risks. He urged the Federal Reserve to remain vigilant.",
    },
    {
        ticker: "GOOGL",
        headline: "Google announces major reorganization, forms new 'AI Labs' division",
        content: "Alphabet, Google's parent company, announced a significant corporate restructuring to consolidate its various artificial intelligence research teams under a new unified division called AI Labs. The move is seen as an effort to accelerate innovation and compete more effectively with rivals.",
    },
];


const getTimestamp = () => {
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function RealtimeNewsFeed({ onSelectNews }: RealtimeNewsFeedProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleNewsClick = (news: AnalyzeNewsSentimentInput) => {
    setSelectedItem(news.headline);
    onSelectNews(news);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Newspaper />
            Real-time News Feed
        </CardTitle>
        <CardDescription>
          Breaking market news. Click on a story to analyze it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {mockNewsData.map((news, index) => (
              <div
                key={index}
                className={cn(
                    "p-4 rounded-lg cursor-pointer border transition-colors",
                    selectedItem === news.headline 
                        ? "bg-muted border-primary" 
                        : "hover:bg-muted"
                )}
                onClick={() => handleNewsClick(news)}
              >
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{news.ticker}</Badge>
                        <span className="text-xs text-muted-foreground">{getTimestamp()}</span>
                    </div>
                    <p className="font-semibold leading-snug">{news.headline}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
