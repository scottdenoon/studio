
'use server';

/**
 * @fileOverview Provides an AI-generated summary of a user's trading journal.
 *
 * - summarizeJournalTrades - A function that returns a performance summary.
 * - SummarizeJournalTradesInput - The input type for the function.
 * - SummarizeJournalTradesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TradeJournalEntry } from '@/services/firestore';

const TradeJournalEntrySchemaForAI = z.object({
  ticker: z.string(),
  entryDate: z.string(),
  exitDate: z.string(),
  entryPrice: z.number(),
  exitPrice: z.number(),
  quantity: z.number(),
  notes: z.string().optional(),
});

const SummarizeJournalTradesInputSchema = z.object({
  trades: z.array(TradeJournalEntrySchemaForAI).describe('An array of the user\'s recent trades.'),
});
export type SummarizeJournalTradesInput = z.infer<typeof SummarizeJournalTradesInputSchema>;

const SummarizeJournalTradesOutputSchema = z.object({
  summary: z.string().describe('A concise, insightful summary of the trading performance, patterns, and potential areas for improvement.'),
});
export type SummarizeJournalTradesOutput = z.infer<typeof SummarizeJournalTradesOutputSchema>;


export async function summarizeJournalTrades(
  input: SummarizeJournalTradesInput
): Promise<SummarizeJournalTradesOutput> {
  return summarizeJournalTradesFlow(input);
}

const summarizeJournalTradesPrompt = ai.definePrompt({
  name: 'summarizeJournalTradesPrompt',
  input: { schema: SummarizeJournalTradesInputSchema },
  output: { schema: SummarizeJournalTradesOutputSchema },
  prompt: `You are an expert trading psychologist and performance coach AI. Your task is to analyze the provided list of trades from a user's journal and deliver a concise, insightful summary.

Your analysis should focus on identifying patterns, strengths, and weaknesses. Do not just state the obvious (e.g., "you had wins and losses"). Provide actionable insights that can help the trader improve.

Based on the trade data, generate a summary that covers:
1.  **Overall Performance:** Briefly comment on the net profitability.
2.  **Key Strengths:** What went right? Identify patterns in winning trades. Did the user follow their notes? Was there a common setup?
3.  **Areas for Improvement:** What went wrong? Identify patterns in losing trades. Was there evidence of cutting winners short or letting losers run? Was there a lack of notes on losing trades? Are they trading specific tickers poorly?
4.  **Actionable Advice:** Based on the analysis, provide 2-3 specific, actionable tips for the trader to consider.

Analyze the following trades:
\`\`\`json
{{{json trades}}}
\`\`\`
`,
});

const summarizeJournalTradesFlow = ai.defineFlow(
  {
    name: 'summarizeJournalTradesFlow',
    inputSchema: SummarizeJournalTradesInputSchema,
    outputSchema: SummarizeJournalTradesOutputSchema,
  },
  async (input) => {
    // We need to calculate P/L for each trade before sending to the model
    const tradesWithPnl = input.trades.map(trade => ({
        ...trade,
        pnl: (trade.exitPrice - trade.entryPrice) * trade.quantity
    }));

    const { output } = await summarizeJournalTradesPrompt({trades: tradesWithPnl as any});
    return output!;
  }
);
