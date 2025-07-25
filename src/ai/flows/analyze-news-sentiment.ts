
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
    .min(1)
    .max(100)
    .describe(
      'A numerical score from 1 to 100 indicating the potential impact on the stock price, where 1 is the lowest impact and 100 is the highest.'
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
  prompt: `You are an expert financial analyst AI. Your task is to analyze the provided news article and determine its potential impact on the stock price for the given ticker.

Based on the headline and content, provide:
1.  A clear sentiment: "positive", "negative", or "neutral".
2.  An impact score from 1 to 100. A score of 1 means very low impact, while 100 means a very high and immediate market reaction is expected. Consider factors like the certainty of the news, the source's reputation, and how direct the impact is on the company's financials.
3.  A concise summary explaining your reasoning for the sentiment and impact score.

Ticker: {{{ticker}}}
Headline: {{{headline}}}
Content: {{{content}}}`,
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
