'use server';

/**
 * @fileOverview An AI-powered flow to ingest and parse raw news data from various sources.
 * 
 * - ingestNewsData - A function that takes a raw string of data and parses it into structured news items.
 * - IngestNewsDataInput - The input type for the ingestNewsData function.
 * - IngestNewsDataOutput - The return type for the ingestNewsData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsItemSchema = z.object({
  ticker: z.string().describe("The stock ticker symbol for the news item."),
  headline: z.string().describe("The headline of the news article."),
  content: z.string().describe("The full content of the news article."),
  momentum: z.object({
    volume: z.string().describe("The trading volume for the stock."),
    relativeVolume: z.number().describe("The relative trading volume compared to the average."),
    float: z.string().describe("The number of shares available for trading."),
    shortInterest: z.string().describe("The percentage of shares held short."),
    priceAction: z.string().describe("A brief description of the recent price action."),
  }).describe("Data related to the stock's market momentum.")
});

const IngestNewsDataInputSchema = z.object({
  rawData: z.string().describe('The raw text or JSON data fetched from the news source URL.'),
});
export type IngestNewsDataInput = z.infer<typeof IngestNewsDataInputSchema>;

const IngestNewsDataOutputSchema = z.object({
  articles: z.array(NewsItemSchema).describe('An array of structured news articles parsed from the raw data.'),
});
export type IngestNewsDataOutput = z.infer<typeof IngestNewsDataOutputSchema>;


export async function ingestNewsData(
  input: IngestNewsDataInput
): Promise<IngestNewsDataOutput> {
  return ingestNewsDataFlow(input);
}

const ingestNewsDataPrompt = ai.definePrompt({
  name: 'ingestNewsDataPrompt',
  input: { schema: IngestNewsDataInputSchema },
  output: { schema: IngestNewsDataOutputSchema },
  prompt: `You are an expert data parsing AI. Your task is to analyze the provided raw data, which could be in JSON, XML, or plain text format, and extract structured news articles from it.

You must parse the following raw data and convert it into a structured array of news articles. Each article must conform to the output schema. Pay close attention to mapping the source data fields to the correct schema fields.

Raw Data:
{{{rawData}}}
`,
});

const ingestNewsDataFlow = ai.defineFlow(
  {
    name: 'ingestNewsDataFlow',
    inputSchema: IngestNewsDataInputSchema,
    outputSchema: IngestNewsDataOutputSchema,
  },
  async (input) => {
    const { output } = await ingestNewsDataPrompt(input);
    return output!;
  }
);
