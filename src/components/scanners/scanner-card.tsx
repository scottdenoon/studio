
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { BarChart, Info } from 'lucide-react';

interface ScannerCardProps {
  scanner: Scanner;
  allNews: NewsItem[];
}

export default function ScannerCard({ scanner, allNews }: ScannerCardProps) {
    const [loading, setLoading] = useState(true);

    const matchingStocks = useMemo(() => {
        setLoading(true);
        const criteria = scanner.criteria;

        const seenTickers = new Set();
        const results: NewsItem[] = [];

        for (const newsItem of allNews) {
            if (seenTickers.has(newsItem.ticker)) {
                continue;
            }

            const latestNewsForTicker = allNews.find(n => n.ticker === newsItem.ticker)!;
            const price = latestNewsForTicker.analysis ? 150 : 50; // MOCK PRICE

            let match = true;
            if (criteria.minPrice && price < criteria.minPrice) match = false;
            if (criteria.maxPrice && price > criteria.maxPrice) match = false;
            if (criteria.minVolume && parseFloat(latestNewsForTicker.momentum.volume) < criteria.minVolume) match = false;
            if (criteria.minRelativeVolume && latestNewsForTicker.momentum.relativeVolume < criteria.minRelativeVolume) match = false;
            if (criteria.newsRequired && !latestNewsForTicker.analysis) match = false;
            // NOTE: Market Cap filter is not implemented as we don't have this data.
            
            if (match) {
                results.push(latestNewsForTicker);
                seenTickers.add(latestNewsForTicker.ticker);
            }
        }
        setLoading(false);
        return results;

    }, [scanner, allNews]);


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
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-right">Rel. Vol</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : matchingStocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                            <Info className="h-8 w-8" />
                                            <span>No stocks match this scan right now.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                matchingStocks.map((stock) => (
                                    <TableRow key={stock.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-semibold">{stock.ticker}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{stock.momentum.volume}</TableCell>
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
