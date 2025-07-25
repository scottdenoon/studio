'use server';

/**
 * @fileOverview Provides an AI-generated summary of current market momentum.
 *
 * - summarizeMomentumTrends -  A function that returns a summary of market momentum.
 * - SummarizeMomentumTrendsInput - The input type for the summarizeMomentumTrends function.
 * - SummarizeMomentumTrendsOutput - The return type for the summarizeMomentumTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMomentumTrendsInputSchema = z.object({
  newsFeed: z.string().describe('A summary of recent market news and price action.'),
});
export type SummarizeMomentumTrendsInput = z.infer<
  typeof SummarizeMomentumTrendsInputSchema
>;

const SummarizeMomentumTrendsOutputSchema = z.object({
  summary: z.string().describe('A summary of current market momentum and key movers.'),
});
export type SummarizeMomentumTrendsOutput = z.infer<
  typeof SummarizeMomentumTrendsOutputSchema
>;

export async function summarizeMomentumTrends(
  input: SummarizeMomentumTrendsInput
): Promise<SummarizeMomentumTrendsOutput> {
  return summarizeMomentumTrendsFlow(input);
}

const summarizeMomentumTrendsPrompt = ai.definePrompt({
  name: 'summarizeMomentumTrendsPrompt',
  input: {schema: SummarizeMomentumTrendsInputSchema},
  output: {schema: SummarizeMomentumTrendsOutputSchema},
  prompt: `You are an AI assistant that summarizes market momentum.

  Focus on identifying stocks with high relative volume, significant price changes, and breaking news. Highlight key movers and the reasons for their momentum based on the following news feed:

  {{{newsFeed}}}`,
});

const summarizeMomentumTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeMomentumTrendsFlow',
    inputSchema: SummarizeMomentumTrendsInputSchema,
    outputSchema: SummarizeMomentumTrendsOutputSchema,
  },
  async input => {
    const {output} = await summarizeMomentumTrendsPrompt(input);
    return output!;
  }
);
