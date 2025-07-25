
'use server';
/**
 * @fileOverview A flow to process a single WebSocket message, parse it, and analyze it.
 * 
 * - processWebSocketMessage - A function that handles the end-to-end processing of a raw WebSocket message.
 * - ProcessWebSocketMessageInput - The input type for the function.
 * - ProcessWebSocketMessageOutput - The return type, which is a fully formed NewsItem.
 */

import { ingestNewsData } from "./ingest-news-data";
import { analyzeNewsSentiment } from "./analyze-news-sentiment";
import { z } from "zod";
import { NewsItem } from "@/services/firestore";

const ProcessWebSocketMessageInputSchema = z.object({
  rawData: z.string().describe('A single raw message received from a WebSocket.'),
});
type ProcessWebSocketMessageInput = z.infer<typeof ProcessWebSocketMessageInputSchema>;

type ProcessWebSocketMessageOutput = NewsItem;

export async function processWebSocketMessage(
  input: ProcessWebSocketMessageInput
): Promise<ProcessWebSocketMessageOutput> {

  // 1. Use the ingest flow to parse the raw data into one or more articles.
  // We assume a single message corresponds to a single news item for simplicity.
  const { articles } = await ingestNewsData({ rawData: input.rawData });

  if (!articles || articles.length === 0) {
    throw new Error("Could not parse a news article from the WebSocket message.");
  }

  const article = articles[0]; // Process the first parsed article

  // 2. Use the analysis flow to get sentiment and impact.
  const analysis = await analyzeNewsSentiment({
    ticker: article.ticker,
    headline: article.headline,
    content: article.content
  });

  // 3. Combine the results into a single NewsItem object.
  const processedItem: NewsItem = {
    ticker: article.ticker,
    headline: article.headline,
    content: article.content,
    momentum: article.momentum,
    analysis: analysis,
    timestamp: new Date().toISOString() // Set timestamp to now
  };

  return processedItem;
}
