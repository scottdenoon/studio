'use server';

import { z } from 'zod';
import { StockDataSchema } from '@/lib/types';

export type StockData = z.infer<typeof StockDataSchema>;


export async function fetchStockData({ ticker }: { ticker: string }): Promise<StockData> {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
        throw new Error('POLYGON_API_KEY is not configured in the environment.');
    }

    try {
        // Fetch company details and previous day's close in parallel
        const [detailsResponse, prevDayResponse] = await Promise.all([
            fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`),
            fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${apiKey}`),
        ]);
        
        if (!detailsResponse.ok) {
             const errorText = await detailsResponse.text();
             console.warn(`Could not fetch company details for ${ticker}: ${errorText}`);
             // Return a default object but still try to get price data
        }
         if (!prevDayResponse.ok) {
            const errorText = await prevDayResponse.text();
            console.error(`Could not fetch previous day data for ${ticker}: ${errorText}`);
             // If price fails, return a zeroed object
            return {
                ticker: ticker,
                name: 'Unknown Company',
                price: 0,
                change: 0,
                changePercent: 0,
                volume: 0,
            };
        }

        const detailsData = await detailsResponse.json();
        const prevDayData = await prevDayResponse.json();
        
        const name = detailsData?.results?.name || 'Unknown Company';
        
        if (!prevDayData.results || prevDayData.results.length === 0) {
             return {
                ticker: ticker,
                name: name,
                price: 0,
                change: 0,
                changePercent: 0,
                volume: 0,
            };
        }

        const quote = prevDayData.results[0];

        return {
            ticker: ticker,
            name: name,
            price: quote.c, // Close price
            change: quote.c - quote.o, // Change (close - open)
            changePercent: ((quote.c - quote.o) / quote.o) * 100,
            volume: quote.v,
        };

    } catch (error) {
        console.error(`[fetchStockData Service Error] for ${ticker}:`, error);
        // Return zeroed data on unexpected errors
        return {
            ticker: ticker,
            name: 'Error Fetching Data',
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
        };
    }
}
