

"use server"

import { db, Timestamp } from "@/lib/firebase/server";
import { AnalyzeNewsSentimentOutput } from "@/ai/flows/analyze-news-sentiment";
import { fetchStockData } from "@/services/market-data";
import { StockDataSchema } from "@/lib/types";
import { logActivity } from "@/services/logging";
import { z } from "zod";

// --- Prompt Management ---

export async function getPrompts(): Promise<Record<string, string>> {
    const promptsCol = db.collection('prompts');
    const promptSnapshot = await promptsCol.get();
    const prompts: Record<string, string> = {};
    promptSnapshot.forEach(doc => {
        prompts[doc.id] = doc.data().content;
    });

    const defaultPrompts = {
        "analyzeNewsSentimentPrompt": `You are an expert financial analyst AI for day traders. Your task is to analyze the provided news article and determine its potential for creating immediate, short-term trading opportunities for the given stock ticker.

Filter out news that is not a direct catalyst for price movement. Ignore:
- General market commentary or sector trends.
- Class-action lawsuits or other legal news with long-term, uncertain outcomes.
- Repetitive PR announcements.
- Anything that is not actionable for a day trader.

Focus on identifying high-impact catalysts like:
- Earnings announcements (especially surprises).
- Mergers and acquisitions (M&A).
- Clinical trial results for biotech companies.
- Major product launches or FDA approvals.
- Analyst upgrades/downgrades from reputable firms.
- Unexpected executive changes.

Based on the headline and content, provide:
1.  A clear sentiment: "positive", "negative", or "neutral" from a trader's perspective.
2.  An impact score from 1 to 100. A score of 1 means very low impact (e.g., market noise), while 100 means a very high and immediate market reaction is expected (e.g., a major M&A announcement).
3.  A concise summary for a trader, explaining *why* this news is or is not a catalyst and the reasoning for your sentiment and impact score.

Ticker: {{{ticker}}}
Headline: {{{headline}}}
Content: {{{content}}}`,
        "summarizeMarketTrendsPrompt": `You are an AI assistant that summarizes market conditions and trends.

  Summarize the market conditions and trends based on the following news feed:

  {{{newsFeed}}}`,
        "summarizeMomentumTrendsPrompt": `You are an AI assistant that summarizes market momentum.

  Focus on identifying stocks with high relative volume, significant price changes, and breaking news. Highlight key movers and the reasons for their momentum based on the following news feed:

  {{{newsFeed}}}`,
        "summarizeJournalTradesPrompt": `You are an expert trading psychologist and performance coach AI. Your task is to analyze the provided list of trades from a user's journal and deliver a concise, insightful summary.

Your analysis should focus on identifying patterns, strengths, and weaknesses. Do not just state the obvious (e.g., "you had wins and losses"). Provide actionable insights that can help the trader improve.

Based on the trade data, generate a summary that covers:
1.  **Overall Performance:** Briefly comment on the net profitability.
2.  **Key Strengths:** What went right? Identify patterns in winning trades. Did the user follow their notes? Was there a common setup?
3.  **Areas for Improvement:** What went wrong? Identify patterns in losing trades. Was there evidence of cutting winners short or letting losers run? Was there a lack of notes on losing trades? Are they trading specific tickers poorly?
4.  **Actionable Advice:** Based on the analysis, provide 2-3 specific, actionable tips for the trader to consider.

Analyze the following trades:
\`\`\`json
{{{json trades}}}
\`\`\`
`
    };

    let createdDefaults = false;
    for (const [id, content] of Object.entries(defaultPrompts)) {
        if (!prompts[id]) {
            await db.collection("prompts").doc(id).set({ content });
            prompts[id] = content;
            createdDefaults = true;
        }
    }
    
    if (createdDefaults) {
        await logActivity("INFO", "Initialized default AI prompts in database.");
    }

    return prompts;
}

export async function getPrompt(id: string): Promise<string> {
    const docRef = db.collection("prompts").doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data()!.content;
    }
    // Return a default if not found to avoid crashing flows
    if (id === 'analyzeNewsSentimentPrompt') return `You are an expert financial analyst AI for day traders. Your task is to analyze the provided news article and determine its potential for creating immediate, short-term trading opportunities for the given stock ticker.

Filter out news that is not a direct catalyst for price movement. Ignore:
- General market commentary or sector trends.
- Class-action lawsuits or other legal news with long-term, uncertain outcomes.
- Repetitive PR announcements.
- Anything that is not actionable for a day trader.

Focus on identifying high-impact catalysts like:
- Earnings announcements (especially surprises).
- Mergers and acquisitions (M&A).
- Clinical trial results for biotech companies.
- Major product launches or FDA approvals.
- Analyst upgrades/downgrades from reputable firms.
- Unexpected executive changes.

Based on the headline and content, provide:
1.  A clear sentiment: "positive", "negative", or "neutral" from a trader's perspective.
2.  An impact score from 1 to 100. A score of 1 means very low impact (e.g., market noise), while 100 means a very high and immediate market reaction is expected (e.g., a major M&A announcement).
3.  A concise summary for a trader, explaining *why* this news is or is not a catalyst and the reasoning for your sentiment and impact score.

Ticker: {{{ticker}}}
Headline: {{{headline}}}
Content: {{{content}}}`;
    if (id === 'summarizeMarketTrendsPrompt') return `You are an AI assistant that summarizes market conditions and trends.

  Summarize the market conditions and trends based on the following news feed:

  {{{newsFeed}}}`;
    if (id === 'summarizeMomentumTrendsPrompt') return `You are an AI assistant that summarizes market momentum.

  Focus on identifying stocks with high relative volume, significant price changes, and breaking news. Highlight key movers and the reasons for their momentum based on the following news feed:

  {{{newsFeed}}}`;
    
    throw new Error(`Prompt with id "${id}" not found!`);
}

export async function savePrompt(id: string, content: string): Promise<void> {
    await db.collection("prompts").doc(id).set({ content });
    await logActivity("INFO", `AI prompt "${id}" was saved.`);
}

// --- Watchlist Management ---

export type WatchlistItemFromDb = {
    id: string;
    userId: string;
    ticker: string;
};

export type WatchlistItem = z.infer<typeof StockDataSchema> & {
  id: string;
  userId: string;
};

export async function getWatchlist(
  userId: string
): Promise<WatchlistItem[]> {
  const watchlistCol = db.collection('watchlist');
  const q = watchlistCol.where('userId', '==', userId).limit(50);
  const watchlistSnapshot = await q.get();

  if (watchlistSnapshot.empty) {
    return [];
  }

  const watchlistPromises = watchlistSnapshot.docs.map(async (doc) => {
    const item = { id: doc.id, ...doc.data() } as WatchlistItemFromDb;
    const stockData = await fetchStockData({ ticker: item.ticker });
    return {
      ...item,
      ...stockData,
    };
  });

  const settledPromises = await Promise.allSettled(watchlistPromises);

  const watchlist: WatchlistItem[] = [];
  settledPromises.forEach((result) => {
    // Check for fulfilled status and ensure the stock data is not a zeroed-out error object
    if (result.status === 'fulfilled' && result.value && result.value.price > 0) {
      watchlist.push(result.value);
    } else if (result.status === 'rejected') {
      console.error('Failed to fetch watchlist item data:', result.reason);
    }
  });

  return watchlist;
}

export async function addWatchlistItem(item: {ticker: string, userId: string}): Promise<void> {
    const stockData = await fetchStockData({ ticker: item.ticker });
    
    if (stockData.price === 0 && stockData.volume === 0) {
        await logActivity("WARN", `User ${item.userId} failed to add invalid ticker "${item.ticker}" to watchlist.`);
        throw new Error(`Could not find a valid stock for ticker "${item.ticker}". Please check the symbol and try again.`);
    }

    const newWatchlistItem = {
        ticker: item.ticker,
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


// --- News Feed Management ---

export interface NewsItem {
    id?: string;
    ticker: string;
    headline: string;
    content: string;
    timestamp: string;
    momentum: {
        volume: string;
        relativeVolume: number;
        float: string;
        shortInterest: string;
        priceAction: string;
    };
    analysis?: AnalyzeNewsSentimentOutput;
}

export type NewsItemCreate = Omit<NewsItem, 'id' | 'timestamp' | 'analysis'>;

export async function getNewsFeed(): Promise<NewsItem[]> {
    const newsCol = db.collection('news_feed');
    const newsSnapshot = await newsCol.orderBy("timestamp", "desc").limit(100).get();
    
    const newsFeed: NewsItem[] = [];
    newsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const timestamp = data.timestamp.toDate().toISOString();

        const plainObject: NewsItem = {
            id: docSnap.id,
            ticker: data.ticker,
            headline: data.headline,
            content: data.content,
            momentum: data.momentum,
            timestamp: timestamp,
            analysis: data.analysis,
        };
        newsFeed.push(plainObject);
    });
    
    return newsFeed;
}


export async function addNewsItem(item: NewsItemCreate): Promise<string> {
    const newItem = {
        ...item,
        timestamp: Timestamp.now(),
        analysis: null, // Ensure analysis is null on creation
    };
    const docRef = await db.collection("news_feed").add(newItem);
    await logActivity("INFO", `News item for "${item.ticker}" added.`, { headline: item.headline, id: docRef.id });
    return docRef.id;
}

export async function updateNewsItem(id: string, item: NewsItemCreate): Promise<void> {
    const newsItemRef = db.collection('news_feed').doc(id);
    await newsItemRef.update({
        ...item,
        analysis: null, // Reset analysis when item is updated
    });
    await logActivity("INFO", `News item for "${item.ticker}" updated.`, { id });
}

export async function deleteNewsItem(id: string): Promise<void> {
    const docRef = db.collection("news_feed").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const { ticker } = doc.data()!;
    await docRef.delete();
    await logActivity("INFO", `News item for "${ticker}" deleted.`, { id });
}


export async function saveNewsItemAnalysis(id: string, analysis: AnalyzeNewsSentimentOutput): Promise<void> {
    const newsItemRef = db.collection('news_feed').doc(id);
    await newsItemRef.update({ analysis });
    await logActivity("INFO", `AI analysis saved for news item.`, { id, sentiment: analysis.sentiment });
}


// --- User Management ---

export interface UserProfile {
    uid: string;
    email: string;
    role: 'admin' | 'basic' | 'premium';
    createdAt: string; 
    lastSeen: string;
    photoURL?: string;
}

export interface NewUserProfile {
    uid: string;
    email: string;
    photoURL?: string | null;
}

export async function addUserProfile(data: NewUserProfile): Promise<UserProfile> {
    const userRef = db.collection("users").doc(data.uid);
    const userDoc = await userRef.get();
    const now = Timestamp.now();
    
    let userProfileData: Omit<UserProfile, 'createdAt' | 'lastSeen'> & { createdAt: Timestamp, lastSeen: Timestamp };

    if (userDoc.exists) {
        const existingData = userDoc.data()!;
        const updateData = { 
            lastSeen: now,
            photoURL: data.photoURL || existingData.photoURL || undefined
        };
        await userRef.update(updateData);
        await logActivity("INFO", `User signed in: ${data.email}`, { uid: data.uid });
        userProfileData = { ...existingData, ...updateData } as Omit<UserProfile, 'createdAt' | 'lastSeen'> & { createdAt: Timestamp, lastSeen: Timestamp };
    } else {
        const usersCol = db.collection('users');
        const userSnapshot = await usersCol.get();
        const isFirstUser = userSnapshot.empty;
        const role = isFirstUser ? 'admin' : 'basic';

        userProfileData = {
            email: data.email,
            uid: data.uid,
            photoURL: data.photoURL || undefined,
            role: role,
            createdAt: now,
            lastSeen: now,
        };
        
        await userRef.set(userProfileData);
        await logActivity("INFO", `New user profile created: ${data.email}`, { uid: data.uid, role });
    }
    
    return {
        ...userProfileData,
        createdAt: userProfileData.createdAt.toDate().toISOString(),
        lastSeen: userProfileData.lastSeen.toDate().toISOString(),
    };
}


export async function getUser(uid: string): Promise<UserProfile | null> {
    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return null;
    }

    const data = docSnap.data()!;
    const plainObject: UserProfile = {
        uid: docSnap.id,
        email: data.email,
        role: data.role,
        photoURL: data.photoURL,
        createdAt: data.createdAt.toDate().toISOString(),
        lastSeen: data.lastSeen.toDate().toISOString(),
    };
    return plainObject;
}

export async function getUsers(): Promise<UserProfile[]> {
    const usersCol = db.collection('users');
    const snapshot = await usersCol.get();
    const users: UserProfile[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        users.push({
            uid: docSnap.id,
            email: data.email,
            role: data.role,
            photoURL: data.photoURL,
            createdAt: data.createdAt.toDate().toISOString(),
            lastSeen: data.lastSeen.toDate().toISOString(),
        });
    });
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return users;
}


export async function addSampleUsers(): Promise<void> {
    const now = Timestamp.now();
    const usersBatch = db.batch();

    const sampleUsers: Omit<UserProfile, 'createdAt' | 'lastSeen' | 'uid' | 'photoURL'>[] = [
        { email: 'premium-user@example.com', role: 'premium' },
        { email: 'basic-user@example.com', role: 'basic' },
    ];
    
    sampleUsers.forEach(user => {
        const userRef = db.collection('users').doc();
        usersBatch.set(userRef, {
            ...user,
            uid: userRef.id,
            photoURL: `https://placehold.co/400x400.png`,
            createdAt: now,
            lastSeen: now,
        });
    });

    await usersBatch.commit();
    await logActivity("INFO", "Seeded database with sample users.");
}


// --- Alert Management ---
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


// --- Scanner Management ---
export interface Scanner {
    id?: string;
    name: string;
    description: string;
    criteria: {
        minVolume?: number;
        minRelativeVolume?: number;
        minPrice?: number;
        maxPrice?: number;
        minMarketCap?: number;
        maxMarketCap?: number;
        newsRequired?: boolean;
    };
    isActive: boolean;
    createdAt?: string;
}

export async function getScanners(): Promise<Scanner[]> {
    const scannerCol = db.collection('scanners');
    const snapshot = await scannerCol.get();
    const scanners: Scanner[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        scanners.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as Scanner);
    });
    scanners.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return scanners;
}

export async function saveScanner(scanner: Omit<Scanner, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection('scanners').add({
        ...scanner,
        createdAt: Timestamp.now(),
    });
    await logActivity("INFO", `Scanner "${scanner.name}" created.`, { id: docRef.id });
    return docRef.id;
}

export async function updateScanner(id: string, scanner: Partial<Scanner>): Promise<void> {
    await db.collection('scanners').doc(id).update(scanner);
    await logActivity("INFO", `Scanner "${scanner.name || 'N/A'}" updated.`, { id });
}

// --- Data Source Management ---
export interface DataSource {
  id?: string;
  name: string;
  type: "API" | "WebSocket";
  url: string;
  isActive: boolean;
  createdAt: string;
  frequency?: number;
}

export async function getDataSources(): Promise<DataSource[]> {
    const dataSourceCol = db.collection('data_sources');
    const snapshot = await dataSourceCol.get();
    const dataSources: DataSource[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        dataSources.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as DataSource);
    });
    dataSources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return dataSources;
}

export async function addDataSource(dataSource: Omit<DataSource, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection('data_sources').add({
        ...dataSource,
        createdAt: Timestamp.now(),
    });
    await logActivity("INFO", `Data source "${dataSource.name}" added.`, { id: docRef.id });
    return docRef.id;
}

export async function updateDataSource(id: string, dataSource: Partial<Omit<DataSource, 'id' | 'createdAt'>>): Promise<void> {
    await db.collection('data_sources').doc(id).update(dataSource);
    await logActivity("INFO", `Data source "${dataSource.name || 'N/A'}" updated.`, { id });
}

// --- Feature Flag Management ---
export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    const flagsCol = db.collection('feature_flags');
    const snapshot = await flagsCol.get();
    
    let flags: FeatureFlag[] = [];
    snapshot.forEach(doc => {
        flags.push({ id: doc.id, ...doc.data() } as FeatureFlag);
    });

    // If no flags, create defaults
    if (flags.length === 0) {
        const defaultFlags = [
            { name: "AI Market Briefing", description: "Enable the AI-powered market summary on the dashboard.", enabled: true },
            { name: "Real-time Scanners", description: "Allow users to access the market scanners page.", enabled: true },
            { name: "User Watchlist", description: "Enable the personal stock watchlist feature for users.", enabled: true },
        ];

        const batch = db.batch();
        const newFlags: FeatureFlag[] = [];

        defaultFlags.forEach(flag => {
            const docRef = flagsCol.doc();
            batch.set(docRef, flag);
            newFlags.push({ id: docRef.id, ...flag });
        });

        await batch.commit();
        await logActivity("INFO", "Initialized default feature flags in database.");
        return newFlags;
    }

    return flags;
}

export async function updateFeatureFlag(id: string, enabled: boolean): Promise<void> {
    const flagRef = db.collection('feature_flags').doc(id);
    await flagRef.update({ enabled });
    const flagDoc = await flagRef.get();
    const flagName = flagDoc.data()?.name || 'N/A';
    await logActivity("INFO", `Feature flag "${flagName}" status changed to ${enabled}.`, { id });
}


// --- DB Test ---
export async function addTestDocument(): Promise<string> {
    const docData = {
        message: "Database connection test successful!",
        timestamp: Timestamp.now(),
    };
    const docRef = await db.collection("test_writes").add(docData);
    await logActivity("INFO", "Database write test executed successfully.", { id: docRef.id });
    return docRef.id;
}

// --- Trade Journal Management ---
export interface TradeJournalEntry {
    id?: string;
    userId: string;
    ticker: string;
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    notes?: string;
    imageUrl?: string;
    createdAt: string;
}

export type TradeJournalEntryCreate = Omit<TradeJournalEntry, 'id' | 'createdAt'>;

export async function getJournalEntries(userId: string): Promise<TradeJournalEntry[]> {
    const journalCol = db.collection('trade_journal');
    const q = journalCol.where('userId', '==', userId);
    const snapshot = await q.get();
    const entries: TradeJournalEntry[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const plainObject: TradeJournalEntry = {
            id: docSnap.id,
            userId: data.userId,
            ticker: data.ticker,
            entryDate: data.entryDate,
            exitDate: data.exitDate,
            entryPrice: data.entryPrice,
            exitPrice: data.exitPrice,
            quantity: data.quantity,
            notes: data.notes,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt.toDate().toISOString(),
        };
        entries.push(plainObject);
    });
    entries.sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    return entries;
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
