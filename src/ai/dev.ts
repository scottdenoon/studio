import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-market-trends.ts';
import '@/ai/flows/summarize-momentum-trends.ts';
import '@/ai/flows/analyze-news-sentiment.ts';
import '@/ai/flows/ingest-news-data.ts';
import '@/ai/tools/get-stock-data-tool.ts';
import '@/ai/flows/process-websocket-message.ts';
