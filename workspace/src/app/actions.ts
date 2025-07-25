
'use server';

import { db } from '@/lib/firebase/server';
import { fetchStockData, StockData } from '@/services/market-data';

export type WatchlistItem = StockData & {
  id: string;
  userId: string;
};

export async function getWatchlist(
  userId: string
): Promise<WatchlistItem[]> {
  const watchlistCol = db.collection('watchlist');
  const q = watchlistCol.where('userId', '==', userId);
  const watchlistSnapshot = await q.get();

  if (watchlistSnapshot.empty) {
    return [];
  }

  const watchlistPromises = watchlistSnapshot.docs.map(async (doc) => {
    const item = { id: doc.id, ...doc.data() } as { id: string, userId: string, ticker: string };
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
    } else if (result.status === 'rejected') {
      console.error('Failed to fetch watchlist item data:', result.reason);
    }
  });

  return watchlist;
}
