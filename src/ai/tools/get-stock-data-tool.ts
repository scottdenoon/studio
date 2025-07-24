'use server';
/**
 * @fileOverview A Genkit tool for fetching real-time stock data from Polygon.io.
 *
 * - getStockData - A tool that retrieves details and quote for a given stock ticker.
 * - StockDataSchema - The Zod schema for the data returned by the tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const StockDataSchema = z.object({
    ticker: z.string().describe('The stock ticker symbol.'),
    name: z.string().describe('The name of the company.'),
    price: z.number().describe('The latest closing price of the stock.'),
    change: z.number().describe('The change in price from the previous day.'),
    changePercent: z.number().describe('The percentage change in price from the previous day.'),
    volume: z.number().describe('The trading volume for the day.'),
});

export type StockData = z.infer<typeof StockDataSchema>;

export const getStockData = ai.defineTool(
    {
        name: 'getStockData',
        description: 'Get the latest quote and company details for a stock ticker.',
        inputSchema: z.object({
            ticker: z.string().describe('The stock ticker symbol to look up.'),
        }),
        outputSchema: StockDataSchema,
    },
    async ({ ticker }) => {
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
            console.error('[getStockData Tool Error]', error);
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
);
