'use server';

/**
 * @fileOverview Provides an AI-generated summary of current market conditions and trends.
 *
 * - summarizeMarketTrends -  A function that returns a summary of market trends.
 * - SummarizeMarketTrendsInput - The input type for the summarizeMarketTrends function.
 * - SummarizeMarketTrendsOutput - The return type for the summarizeMarketTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPrompt } from '@/services/firestore';

const SummarizeMarketTrendsInputSchema = z.object({
  newsFeed: z.string().describe('A summary of recent market news.'),
});
export type SummarizeMarketTrendsInput = z.infer<
  typeof SummarizeMarketTrendsInputSchema
>;

const SummarizeMarketTrendsOutputSchema = z.object({
  summary: z.string().describe('A summary of current market conditions.'),
});
export type SummarizeMarketTrendsOutput = z.infer<
  typeof SummarizeMarketTrendsOutputSchema
>;

export async function summarizeMarketTrends(
  input: SummarizeMarketTrendsInput
): Promise<SummarizeMarketTrendsOutput> {
  return summarizeMarketTrendsFlow(input);
}

const summarizeMarketTrendsPrompt = ai.definePrompt({
  name: 'summarizeMarketTrendsPrompt',
  input: {schema: SummarizeMarketTrendsInputSchema},
  output: {schema: SummarizeMarketTrendsOutputSchema},
  prompt: async () => await getPrompt('summarizeMarketTrendsPrompt'),
});

const summarizeMarketTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeMarketTrendsFlow',
    inputSchema: SummarizeMarketTrendsInputSchema,
    outputSchema: SummarizeMarketTrendsOutputSchema,
  },
  async input => {
    const {output} = await summarizeMarketTrendsPrompt(input);
    return output!;
  }
);
