
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
import { Newspaper, ChevronDown, TrendingUp, BarChart2, Users, FileText } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface NewsItem extends AnalyzeNewsSentimentInput {
    momentum: {
        volume: string;
        relativeVolume: number;
        float: string;
        shortInterest: string;
        priceAction: string;
    };
}

interface RealtimeNewsFeedProps {
  onSelectNews: (news: AnalyzeNewsSentimentInput) => void;
}

const mockNewsData: NewsItem[] = [
    {
        ticker: "TSLA",
        headline: "Tesla reports record Q4 deliveries, beating analyst expectations",
        content: "Tesla announced it delivered 484,507 vehicles in the fourth quarter and 1.81 million vehicles for the full year 2023, marking a 38% increase from the previous year. The results sent TSLA shares up 3% in pre-market trading.",
        momentum: {
            volume: "45.1M",
            relativeVolume: 2.5,
            float: "950M",
            shortInterest: "3.1%",
            priceAction: "Pre-market gap up, consolidating near highs.",
        }
    },
    {
        ticker: "NVDA",
        headline: "NVIDIA unveils new AI chips for gaming and data centers",
        content: "NVIDIA today took the wraps off its latest generation of graphics processing units, the RTX 50 series, with major improvements in ray tracing and AI-powered DLSS technology. The company also revealed its new H200 data center GPU, aiming to continue its dominance in the AI hardware market.",
        momentum: {
            volume: "88.2M",
            relativeVolume: 1.8,
            float: "2.5B",
            shortInterest: "1.5%",
            priceAction: "Strong uptrend, breaking key resistance levels.",
        }
    },
    {
        ticker: "AAPL",
        headline: "Apple Vision Pro launch date set for February 2nd",
        content: "Apple has officially announced that its much-anticipated Vision Pro mixed-reality headset will be available in the U.S. starting February 2nd, with pre-orders beginning January 19th. The device is priced at $3,499.",
        momentum: {
            volume: "60.3M",
            relativeVolume: 0.9,
            float: "15.4B",
            shortInterest: "0.7%",
            priceAction: "Range-bound, testing support at the 50-day moving average.",
        }
    },
    {
        ticker: "MSFT",
        headline: "Microsoft to acquire gaming giant Activision Blizzard for $68.7 billion",
        content: "In a landmark deal for the gaming industry, Microsoft has agreed to purchase Activision Blizzard, the publisher of major franchises like Call of Duty and World of Warcraft. The all-cash transaction is expected to close in 2024.",
        momentum: {
            volume: "35.8M",
            relativeVolume: 1.2,
            float: "7.4B",
            shortInterest: "0.5%",
            priceAction: "Initial spike on news, now in a controlled pullback.",
        }
    },
    {
        ticker: "JPM",
        headline: "JPMorgan Chase CEO Jamie Dimon warns of persistent inflation",
        content: "Jamie Dimon, CEO of JPMorgan Chase, stated in an interview that he believes inflationary pressures could be more persistent than the market currently expects, citing strong consumer demand and geopolitical risks. He urged the Federal Reserve to remain vigilant.",
        momentum: {
            volume: "15.2M",
            relativeVolume: 1.1,
            float: "3.0B",
            shortInterest: "1.2%",
            priceAction: "Gradual downtrend following comments, breaking below short-term support.",
        }
    },
    {
        ticker: "GOOGL",
        headline: "Google announces major reorganization, forms new 'AI Labs' division",
        content: "Alphabet, Google's parent company, announced a significant corporate restructuring to consolidate its various artificial intelligence research teams under a new unified division called AI Labs. The move is seen as an effort to accelerate innovation and compete more effectively with rivals.",
        momentum: {
            volume: "22.9M",
            relativeVolume: 1.0,
            float: "5.8B",
            shortInterest: "0.8%",
            priceAction: "Consolidating gains after a positive market reaction to restructuring news.",
        }
    },
];


const getTimestamp = () => {
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const MomentumIndicator = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 mr-2 text-accent" />
        <span className="font-medium">{label}:</span>
        <span className="ml-auto font-mono text-foreground">{value}</span>
    </div>
);

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
          Breaking market news. Click on a story to analyze it and view momentum data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {mockNewsData.map((news, index) => (
              <Collapsible key={index} className={cn(
                  "border rounded-lg transition-colors",
                  selectedItem === news.headline 
                      ? "bg-muted border-primary" 
                      : "hover:bg-muted/50"
              )}>
                <CollapsibleTrigger className="w-full p-3 text-left group">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-base py-1 px-3">{news.ticker}</Badge>
                            <p className="font-semibold leading-snug flex-1">{news.headline}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{getTimestamp()}</span>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 pt-0">
                    <Separator className="mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                        <MomentumIndicator icon={BarChart2} label="Volume" value={news.momentum.volume} />
                        <MomentumIndicator icon={TrendingUp} label="Relative Volume" value={news.momentum.relativeVolume.toFixed(2)} />
                        <MomentumIndicator icon={Users} label="Float" value={news.momentum.float} />
                        <MomentumIndicator icon={FileText} label="Short Interest" value={news.momentum.shortInterest} />
                    </div>
                     <p className="text-xs italic text-muted-foreground mb-4 px-2 py-1.5 bg-background rounded-md border">{news.content}</p>
                    <Button
                        onClick={() => handleNewsClick(news)}
                        size="sm"
                        variant="ghost"
                        className="w-full"
                    >
                        Analyze with AI
                    </Button>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
