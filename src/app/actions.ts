
'use server';

import { db, Timestamp } from "@/lib/firebase/server";
import { getWatchlist as getWatchlistFromDb, getJournalEntries as getJournalEntriesFromDb, WatchlistItem, TradeJournalEntry, TradeJournalEntryCreate, getUser as getUserFromDb, UserProfile, addDataSource as addDataSourceToDb, getDataSources as getDataSourcesFromDb, updateDataSource as updateDataSourceInDb, DataSource, FeatureFlag, getFeatureFlags as getFeatureFlagsFromDb, updateFeatureFlag as updateFeatureFlagInDb, addSampleUsers as addSampleUsersToDb, getUsers as getUsersFromDb, getMarketDataConfig as getMarketDataConfigFromDb, updateMarketDataConfig as updateMarketDataConfigInDb, getScanners as getScannersFromDb, saveScanner as saveScannerInDb, updateScanner as updateScannerInDb, Scanner, addTestDocument as addTestDocumentInDb, getPrompts as getPromptsFromDb, savePrompt as savePromptInDb } from '@/services/firestore';
import { logActivity } from "@/services/logging";
import { fetchStockData } from "@/services/market-data";
import { NewsSource as NewsSourceType, fetchNewsFromSources as fetchNewsFromSourcesAction } from "@/app/admin/news/actions";


export async function getWatchlistAction(
  userId: string
): Promise<WatchlistItem[]> {
  return getWatchlistFromDb(userId);
}

export async function getJournalEntriesAction(
  userId: string
): Promise<TradeJournalEntry[]> {
  return getJournalEntriesFromDb(userId);
}

export async function getUserAction(uid: string): Promise<UserProfile | null> {
    return getUserFromDb(uid);
}

export async function addWatchlistItem(item: {ticker: string, userId: string}): Promise<void> {
    const stockData = await fetchStockData({ ticker: item.ticker });
    
    if (stockData.price === 0 && stockData.volume === 0) {
        await logActivity("WARN", `User ${item.userId} failed to add invalid ticker "${item.ticker}" to watchlist.`);
        throw new Error(`Could not find a valid stock for ticker "${item.ticker}". Please check the symbol and try again.`);
    }

    const newWatchlistItem = {
        ticker: item.ticker.toUpperCase(),
        userId: item.userId,
    };

    await db.collection("watchlist").add(newWatchlistItem);
    await logActivity("INFO", `User ${item.userId} added "${item.ticker}" to watchlist.`);
}

export async function removeWatchlistItem(id: string): Promise<void> {
    const docRef = db.collection("watchlist").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const { userId, ticker } = doc.data()!;
    await docRef.delete();
    await logActivity("INFO", `User ${userId} removed "${ticker}" from watchlist.`);
}

export interface AlertItem {
    id?: string;
    userId: string;
    ticker: string;
    priceAbove?: number;
    priceBelow?: number;
    momentum?: string;
    createdAt: string;
}

export async function addAlert(item: Omit<AlertItem, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection("alerts").add({
        ...item,
        createdAt: Timestamp.now(),
    });
    await logActivity("INFO", `User ${item.userId} set alert for ${item.ticker}.`, { id: docRef.id });
    return docRef.id;
}


export async function addJournalEntry(entry: TradeJournalEntryCreate): Promise<string> {
    const docRef = await db.collection('trade_journal').add({
        ...entry,
        entryDate: Timestamp.fromDate(new Date(entry.entryDate)),
        exitDate: Timestamp.fromDate(new Date(entry.exitDate)),
        createdAt: Timestamp.now(),
    });
    await logActivity("INFO", `User ${entry.userId} added journal entry for ${entry.ticker}.`, { id: docRef.id });
    return docRef.id;
}

export async function updateJournalEntry(id: string, entry: Partial<TradeJournalEntryCreate>): Promise<void> {
    const updatedData: Record<string, any> = { ...entry };
    if (entry.entryDate) {
        updatedData.entryDate = Timestamp.fromDate(new Date(entry.entryDate));
    }
    if (entry.exitDate) {
        updatedData.exitDate = Timestamp.fromDate(new Date(entry.exitDate));
    }
    await db.collection('trade_journal').doc(id).update(updatedData);
    await logActivity("INFO", `Journal entry ${id} updated.`, { ticker: entry.ticker });
}

export async function deleteJournalEntry(id: string): Promise<void> {
    const docRef = db.collection("trade_journal").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const { userId, ticker } = doc.data()!;
    await docRef.delete();
    await logActivity("INFO", `User ${userId} deleted journal entry for ${ticker}.`, { id });
}


// Admin page actions
export async function addDataSource(dataSource: Omit<DataSource, 'id' | 'createdAt'>): Promise<string> {
    return addDataSourceToDb(dataSource);
}

export async function getDataSources(): Promise<DataSource[]> {
    return getDataSourcesFromDb();
}

export async function updateDataSource(id: string, dataSource: Partial<Omit<DataSource, 'id' | 'createdAt'>>): Promise<void> {
    return updateDataSourceInDb(id, dataSource);
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    return getFeatureFlagsFromDb();
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<void> {
    return updateFeatureFlagInDb(id, enabled);
}

export async function addSampleUsers(): Promise<void> {
    return addSampleUsersToDb();
}

export async function getUsers(): Promise<UserProfile[]> {
    return getUsersFromDb();
}

export async function getMarketDataConfig(): Promise<Record<string, boolean>> {
    return getMarketDataConfigFromDb();
}

export async function updateMarketDataConfig(config: Record<string, boolean>): Promise<void> {
    return updateMarketDataConfigInDb(config);
}

export async function getScanners(): Promise<Scanner[]> {
    return getScannersFromDb();
}

export async function saveScanner(scanner: Omit<Scanner, 'id' | 'createdAt'>): Promise<string> {
    return saveScannerInDb(scanner);
}

export async function updateScanner(id: string, scanner: Partial<Omit<Scanner, 'id'| 'createdAt'>>): Promise<void> {
    return updateScannerInDb(id, scanner);
}

export async function addTestDocument(): Promise<string> {
    return addTestDocumentInDb();
}

export async function getPrompts(): Promise<Record<string, string>> {
    return getPromptsFromDb();
}

export async function savePrompt(id: string, content: string): Promise<void> {
    return savePromptInDb(id, content);
}


export type NewsSource = NewsSourceType;

export async function fetchNewsFromSources(): Promise<{ importedCount: number, filteredCount: number }> {
    return fetchNewsFromSourcesAction();
}

export { getNewsSources, addNewsSource, updateNewsSource, deleteNewsSource } from '@/app/admin/news/actions';
