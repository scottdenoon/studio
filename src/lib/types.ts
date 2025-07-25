import { z } from 'zod';

export const StockDataSchema = z.object({
    ticker: z.string().describe('The stock ticker symbol.'),
    name: z.string().describe('The name of the company.'),
    price: z.number().describe('The latest closing price of the stock.'),
    change: z.number().describe('The change in price from the previous day.'),
    changePercent: z.number().describe('The percentage change in price from the previous day.'),
    volume: z.number().describe('The trading volume for the day.'),
});
