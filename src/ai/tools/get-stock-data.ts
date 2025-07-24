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
                 throw new Error(`Failed to fetch company details from Polygon: ${detailsResponse.status} ${errorText}`);
            }
             if (!prevDayResponse.ok) {
                const errorText = await prevDayResponse.text();
                throw new Error(`Failed to fetch previous day data from Polygon: ${prevDayResponse.status} ${errorText}`);
            }

            const detailsData = await detailsResponse.json();
            const prevDayData = await prevDayResponse.json();
            
            const name = detailsData.results?.name || 'Unknown Company';
            
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
            throw new Error(`Failed to fetch data for ticker ${ticker}: ${(error as Error).message}`);
        }
    }
);
