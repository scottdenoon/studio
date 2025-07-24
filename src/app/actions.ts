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
    const docData = doc.data();
    const stockData = await fetchStockData({ ticker: docData.ticker });
    return {
      id: doc.id,
      userId: docData.userId,
      ...stockData,
    };
  });

  const settledPromises = await Promise.allSettled(watchlistPromises);

  const watchlist: WatchlistItem[] = [];
  settledPromises.forEach((result) => {
    if (result.status === 'fulfilled') {
      watchlist.push(result.value);
    } else {
      console.error('Failed to fetch watchlist item data:', result.reason);
    }
  });

  return watchlist;
}
