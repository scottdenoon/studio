'use server';

import { getStockData, StockData } from "@/ai/tools/get-stock-data-tool";

export type { StockData } from '@/ai/tools/get-stock-data-tool';

export async function fetchStockData({ ticker }: { ticker: string }): Promise<StockData> {
    return await getStockData({ ticker });
}
