
'use server';

import { db } from '@/lib/firebase/server';
import { fetchStockData, StockData } from '@/services/market-data';
import { getWatchlist as getWatchlistFromDb } from '@/services/firestore';

export type WatchlistItem = StockData & {
  id: string;
  userId: string;
};

export async function getWatchlist(
  userId: string
): Promise<WatchlistItem[]> {
  const watchlistItems = await getWatchlistFromDb(userId);
  
  const watchlistPromises = watchlistItems.map(async (item) => {
    const stockData = await fetchStockData({ ticker: item.ticker });
    return {
      ...item,
      ...stockData,
    };
  });

  const settledPromises = await Promise.allSettled(watchlistPromises);

  const watchlist: WatchlistItem[] = [];
  settledPromises.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      watchlist.push(result.value);
    } else {
      console.error('Failed to fetch watchlist item data:', result.reason);
    }
  });

  return watchlist;
}
