
'use server';

import { getWatchlist, WatchlistItem, getJournalEntries, TradeJournalEntry } from '@/services/firestore';

export async function getWatchlistAction(
  userId: string
): Promise<WatchlistItem[]> {
  return getWatchlist(userId);
}

export async function getJournalEntriesAction(
  userId: string
): Promise<TradeJournalEntry[]> {
  return getJournalEntries(userId);
}
