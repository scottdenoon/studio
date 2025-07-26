
'use server';

import { db, Timestamp } from "@/lib/firebase/server";
import { getWatchlist as getWatchlistFromDb, getJournalEntries as getJournalEntriesFromDb, WatchlistItem, TradeJournalEntry, TradeJournalEntryCreate, getUser as getUserFromDb, UserProfile, addDataSource as addDataSourceToDb, getDataSources as getDataSourcesFromDb, updateDataSource as updateDataSourceInDb, DataSource, FeatureFlag, getFeatureFlags as getFeatureFlagsFromDb, updateFeatureFlag as updateFeatureFlagInDb, addSampleUsers as addSampleUsersToDb, getUsers as getUsersFromDb, getMarketDataConfig as getMarketDataConfigFromDb, updateMarketDataConfig as updateMarketDataConfigInDb, getScanners as getScannersFromDb, saveScanner as saveScannerInDb, updateScanner as updateScannerInDb, Scanner, addTestDocument as addTestDocumentInDb, getPrompts as getPromptsFromDb, savePrompt as savePromptInDb, getNewsFeed as getNewsFeedFromDb, addNewsItem as addNewsItemToDb, saveNewsItemAnalysis as saveNewsItemAnalysisToDb } from '@/services/firestore';
import { logActivity } from "@/services/logging";
import { fetchStockData } from "@/services/market-data";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { ingestNewsData, IngestNewsDataInput } from "@/ai/flows/ingest-news-data";
import { NewsSource, NewsSourceFilters } from "@/lib/types";


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

export async function getNewsFeedAction(): Promise<any[]> {
    return getNewsFeedFromDb();
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

// --- News Source Management ---
export async function getNewsSources(): Promise<NewsSource[]> {
    const newsSourceCol = db.collection('news_sources');
    const snapshot = await newsSourceCol.get();
    const newsSources: NewsSource[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newsSources.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as NewsSource);
    });
    newsSources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return newsSources;
}

export async function addNewsSource(newsSource: Omit<NewsSource, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection('news_sources').add({
        ...newsSource,
        createdAt: Timestamp.now(),
    });
    await logActivity("INFO", `News source "${newsSource.name}" added.`, { id: docRef.id });
    return docRef.id;
}

export async function updateNewsSource(id: string, newsSource: Partial<Omit<NewsSource, 'id' | 'createdAt'>>): Promise<void> {
    await db.collection('news_sources').doc(id).update(newsSource);
    await logActivity("INFO", `News source "${newsSource.name || 'N/A'}" updated.`, { id });
}

export async function deleteNewsSource(id: string): Promise<void> {
    const docRef = db.collection("news_sources").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const { name } = doc.data()!;
    await docRef.delete();
    await logActivity("INFO", `News source "${name}" deleted.`, { id });
}


function applyFilters(articles: any[], filters?: NewsSourceFilters): any[] {
    if (!filters) {
        return articles;
    }

    return articles.filter(article => {
        const articleText = `${article.headline} ${article.content}`.toLowerCase();

        // Exclude if any exclude keyword is found
        if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
            if (filters.excludeKeywords.some(keyword => articleText.includes(keyword.toLowerCase()))) {
                return false;
            }
        }

        // Include if no include keywords are specified, or if at least one is found
        if (filters.includeKeywords && filters.includeKeywords.length > 0) {
            if (!filters.includeKeywords.some(keyword => articleText.includes(keyword.toLowerCase()))) {
                return false;
            }
        }

        return true;
    });
}


async function fetchNewsFromSources(): Promise<{ importedCount: number, filteredCount: number }> {
    const sources = await getNewsSources();
    const activeSources = sources.filter(s => s.isActive && s.type === 'API');
    let totalImportedCount = 0;
    let totalFilteredCount = 0;

    for (const source of activeSources) {
        try {
            const url = new URL(source.url);
            if (source.apiKeyEnvVar) {
                const apiKey = process.env[source.apiKeyEnvVar];
                if (apiKey) {
                    url.searchParams.append('apiKey', apiKey);
                } else {
                    await logActivity("WARN", `API key environment variable "${source.apiKeyEnvVar}" not set for source: ${source.name}.`);
                }
            }

            const response = await fetch(url.toString());
            const rawData = await response.text();
            
            await logActivity("INFO", `Fetched from source: ${source.name}`, { 
                source: source.name,
                status: response.status,
                ok: response.ok,
                dataVolume: `${rawData.length} bytes`,
                dataSnippet: rawData.substring(0, 200) + '...',
            });

            if (!response.ok) {
                await logActivity("WARN", `Non-OK response from source: ${source.name}`, { status: response.status });
                continue;
            }
            
            const ingestInput: IngestNewsDataInput = { rawData };
            if (source.isFieldMappingEnabled && source.fieldMapping && source.fieldMapping.length > 0) {
              ingestInput.fieldMapping = source.fieldMapping.reduce((acc, item) => {
                acc[item.dbField] = item.sourceField;
                return acc;
              }, {} as {[key: string]: string});
            }

            // Use AI to parse the raw data
            const { articles } = await ingestNewsData(ingestInput);

            if (!articles || articles.length === 0) {
                 await logActivity("WARN", `AI could not parse any articles from source: ${source.name}`);
                 continue;
            }
            
            // Apply content filters
            const filteredArticles = applyFilters(articles, source.filters);
            const filteredOutCount = articles.length - filteredArticles.length;
            if (filteredOutCount > 0) {
                await logActivity("INFO", `Filtered out ${filteredOutCount} articles from source: ${source.name}`, { source: source.name });
                totalFilteredCount += filteredOutCount;
            }


            const analysisPromises: Promise<void>[] = [];
            for (const article of filteredArticles) {
                const newsItemId = await addNewsItemToDb({
                    ticker: article.ticker,
                    headline: article.headline,
                    content: article.content,
                    momentum: article.momentum,
                    publishedDate: article.publishedDate,
                });
                totalImportedCount++;

                // Trigger AI analysis asynchronously
                const analysisPromise = analyzeNewsSentiment({ 
                    ticker: article.ticker, 
                    headline: article.headline, 
                    content: article.content 
                }).then(analysis => {
                    return saveNewsItemAnalysisToDb(newsItemId, analysis);
                }).catch(err => {
                    console.error(`Error analyzing news item ${newsItemId}:`, err);
                    logActivity("ERROR", `Failed to analyze news item for ${article.ticker}`, { id: newsItemId, error: (err as Error).message });
                });
                analysisPromises.push(analysisPromise);
            }
            
            // Wait for all analysis tasks for the current source to complete
            await Promise.all(analysisPromises);
            await logActivity("INFO", `Processed ${filteredArticles.length} articles from source: ${source.name}`, { source: source.name, count: filteredArticles.length });

        } catch (error) {
            console.error(`Error processing source ${source.name}:`, error);
            await logActivity("ERROR", `Error processing news source: ${source.name}`, { error: (error as Error).message });
        }
    }

    if (totalImportedCount > 0 || totalFilteredCount > 0) {
        await logActivity("INFO", `Completed news ingestion cycle. Total imported: ${totalImportedCount}. Total filtered: ${totalFilteredCount}.`);
    }

    return { importedCount: totalImportedCount, filteredCount: totalFilteredCount };
}


export async function runNewsIngestionAction(): Promise<{ importedCount: number, filteredCount: number }> {
    return fetchNewsFromSources();
}
