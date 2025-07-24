'use server';

/**
 * @fileOverview AI-powered news sentiment analysis for real-time trading decisions.
 *
 * - analyzeNewsSentiment - Analyzes news headlines and content to determine potential stock price impact.
 * - AnalyzeNewsSentimentInput - Input type for the analyzeNewsSentiment function, including news headline and content.
 * - AnalyzeNewsSentimentOutput - Return type for the analyzeNewsSentiment function, providing sentiment analysis and impact score.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeNewsSentimentInputSchema = z.object({
  headline: z.string().describe('The headline of the news article.'),
  content: z.string().describe('The content of the news article.'),
  ticker: z.string().describe('The ticker symbol of the stock related to the news.'),
});
export type AnalyzeNewsSentimentInput = z.infer<typeof AnalyzeNewsSentimentInputSchema>;

const AnalyzeNewsSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The overall sentiment of the news (e.g., positive, negative, neutral).'
    ),
  impactScore: z
    .number()
    .describe(
      'A numerical score indicating the potential impact on the stock price (e.g., -1 to 1).'
    ),
  summary: z.string().describe('A brief summary of the news and its potential impact.'),
});
export type AnalyzeNewsSentimentOutput = z.infer<typeof AnalyzeNewsSentimentOutputSchema>;

export async function analyzeNewsSentiment(
  input: AnalyzeNewsSentimentInput
): Promise<AnalyzeNewsSentimentOutput> {
  return analyzeNewsSentimentFlow(input);
}

const analyzeNewsSentimentPrompt = ai.definePrompt({
  name: 'analyzeNewsSentimentPrompt',
  input: {schema: AnalyzeNewsSentimentInputSchema},
  output: {schema: AnalyzeNewsSentimentOutputSchema},
  prompt: `You are an AI-powered financial news analyst.

  Analyze the following news article to determine its sentiment and potential impact on the stock price.
  Provide a sentiment analysis (positive, negative, or neutral), an impact score (-1 to 1), and a brief summary of the news and its potential impact.

  Ticker: {{{ticker}}}
  Headline: {{{headline}}}
  Content: {{{content}}}

  Sentiment: 
  Impact Score:
  Summary:`,
});

const analyzeNewsSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeNewsSentimentFlow',
    inputSchema: AnalyzeNewsSentimentInputSchema,
    outputSchema: AnalyzeNewsSentimentOutputSchema,
  },
  async input => {
    const {output} = await analyzeNewsSentimentPrompt(input);
    return output!;
  }
);
