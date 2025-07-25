
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
  prompt: `You are an expert financial analyst AI for day traders. Your task is to analyze the provided news article and determine its potential for creating immediate, short-term trading opportunities for the given stock ticker.

Filter out news that is not a direct catalyst for price movement. Ignore:
- General market commentary or sector trends.
- Class-action lawsuits or other legal news with long-term, uncertain outcomes.
- Repetitive PR announcements.
- Anything that is not actionable for a day trader.

Focus on identifying high-impact catalysts like:
- Earnings announcements (especially surprises).
- Mergers and acquisitions (M&A).
- Clinical trial results for biotech companies.
- Major product launches or FDA approvals.
- Analyst upgrades/downgrades from reputable firms.
- Unexpected executive changes.

Based on the headline and content, provide:
1.  A clear sentiment: "positive", "negative", or "neutral" from a trader's perspective.
2.  An impact score from 1 to 100. A score of 1 means very low impact (e.g., market noise), while 100 means a very high and immediate market reaction is expected (e.g., a major M&A announcement).
3.  A concise summary for a trader, explaining *why* this news is or is not a catalyst and the reasoning for your sentiment and impact score.

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
