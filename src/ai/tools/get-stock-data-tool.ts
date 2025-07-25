/**
 * @fileOverview A Genkit tool for fetching real-time stock data.
 *
 * - getStockData - A tool that retrieves details and quote for a given stock ticker.
 * - StockDataSchema - The Zod schema for the data returned by the tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchStockData } from '@/services/market-data';
import { StockDataSchema as MarketDataStockSchema } from '@/lib/types';

export const StockDataSchema = MarketDataStockSchema;

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
        // The core logic is now in the market-data service.
        // This tool simply acts as a wrapper for the AI to use.
        return await fetchStockData({ ticker });
    }
);
