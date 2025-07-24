
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Scanner, NewsItem } from '@/services/firestore';
import { Skeleton } from '../ui/skeleton';
import { BarChart, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getStockData } from '@/ai/tools/get-stock-data';
import { StockData } from '@/ai/tools/get-stock-data';

interface ScannerCardProps {
  scanner: Scanner;
  allNews: NewsItem[];
}

type MatchedStock = NewsItem & {
    stockData?: StockData;
};

export default function ScannerCard({ scanner, allNews }: ScannerCardProps) {
    const [loading, setLoading] = useState(true);
    const [matchedStocks, setMatchedStocks] = useState<MatchedStock[]>([]);

    const runScan = useCallback(async () => {
        setLoading(true);
        const criteria = scanner.criteria;
        const seenTickers = new Set();
        const initialMatches: NewsItem[] = [];

        for (const newsItem of allNews) {
            if (seenTickers.has(newsItem.ticker)) {
                continue;
            }
            initialMatches.push(newsItem);
            seenTickers.add(newsItem.ticker);
        }

        const stockDataPromises = initialMatches.map(item => getStockData({ ticker: item.ticker }));
        const stockDataResults = await Promise.allSettled(stockDataPromises);
        
        const results: MatchedStock[] = [];
        for (let i = 0; i < initialMatches.length; i++) {
            const newsItem = initialMatches[i];
            const stockDataResult = stockDataResults[i];

            if (stockDataResult.status === 'rejected') {
                console.warn(`Could not fetch data for ${newsItem.ticker}:`, stockDataResult.reason);
                continue; // Skip if we can't get market data
            }

            const stockData = stockDataResult.value;
            let match = true;

            if (criteria.minPrice && stockData.price < criteria.minPrice) match = false;
            if (criteria.maxPrice && stockData.price > criteria.maxPrice) match = false;
            if (criteria.minVolume && stockData.volume < criteria.minVolume) match = false;
            if (criteria.minRelativeVolume && newsItem.momentum.relativeVolume < criteria.minRelativeVolume) match = false;
            if (criteria.newsRequired && !newsItem.analysis) match = false;
            
            if (match) {
                results.push({ ...newsItem, stockData });
            }
        }
        
        setMatchedStocks(results);
        setLoading(false);
    }, [scanner, allNews]);

    useEffect(() => {
        runScan();
    }, [runScan]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <BarChart className='h-5 w-5 text-primary' />
                    {scanner.name}
                </CardTitle>
                <CardDescription>{scanner.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                     <Table>
                        <TableHeader className='sticky top-0 bg-background'>
                            <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                            <TableHead className="text-right">Rel. Vol</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : matchedStocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                            <Info className="h-8 w-8" />
                                            <span>No stocks match this scan right now.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                matchedStocks.map((stock) => (
                                    <TableRow key={stock.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-semibold">{stock.ticker}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">${stock.stockData?.price.toFixed(2)}</TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${stock.stockData && stock.stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {stock.stockData?.changePercent.toFixed(2)}%
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{stock.momentum.relativeVolume.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
