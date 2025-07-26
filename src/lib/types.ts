import { z } from 'zod';

export const StockDataSchema = z.object({
    ticker: z.string().describe('The stock ticker symbol.'),
    name: z.string().describe('The name of the company.'),
    price: z.number().describe('The latest closing price of the stock.'),
    change: z.number().describe('The change in price from the previous day.'),
    changePercent: z.number().describe('The percentage change in price from the previous day.'),
    volume: z.number().describe('The trading volume for the day.'),
});

// --- News Source Management ---
export interface FieldMapping {
    dbField: string;
    sourceField: string;
}

export interface NewsSourceFilters {
    includeKeywords?: string[];
    excludeKeywords?: string[];
}

export interface NewsSource {
  id?: string;
  name: string;
  type: "API" | "WebSocket";
  url: string;
  isActive: boolean;
  createdAt: string;
  apiKeyEnvVar?: string;
  fieldMapping?: FieldMapping[];
  isFieldMappingEnabled?: boolean;
  frequency?: number;
  filters?: NewsSourceFilters;
}
