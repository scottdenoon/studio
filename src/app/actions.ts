
'use server';

import { getWatchlist, WatchlistItem } from '@/services/firestore';

export async function getWatchlistAction(
  userId: string
): Promise<WatchlistItem[]> {
  return getWatchlist(userId);
}
