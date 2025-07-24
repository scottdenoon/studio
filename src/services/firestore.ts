
"use server"

import { db, Timestamp } from "@/lib/firebase/server";
import { AnalyzeNewsSentimentOutput } from "@/ai/flows/analyze-news-sentiment";

// --- Prompt Management ---

export async function getPrompts(): Promise<Record<string, string>> {
    const promptsCol = db.collection('prompts');
    const promptSnapshot = await promptsCol.get();
    const prompts: Record<string, string> = {};
    promptSnapshot.forEach(doc => {
        prompts[doc.id] = doc.data().content;
    });
    // Add default prompts if they don't exist
    const defaultPrompts = {
        "analyzeNewsSentimentPrompt": `You are an AI-powered financial news analyst.

  Analyze the following news article to determine its sentiment and potential impact on the stock price.
  Provide a sentiment analysis (positive, negative, or neutral), an impact score from 1 to 100, and a brief summary of the news and its potential impact.

  Ticker: {{{ticker}}}
  Headline: {{{headline}}}
  Content: {{{content}}}`,
        "summarizeMarketTrendsPrompt": `You are an AI assistant that summarizes market conditions and trends.

  Summarize the market conditions and trends based on the following news feed:

  {{{newsFeed}}}`,
        "summarizeMomentumTrendsPrompt": `You are an AI assistant that summarizes market momentum.

  Focus on identifying stocks with high relative volume, significant price changes, and breaking news. Highlight key movers and the reasons for their momentum based on the following news feed:

  {{{newsFeed}}}`
    };

    for (const [id, content] of Object.entries(defaultPrompts)) {
        if (!prompts[id]) {
            await savePrompt(id, content);
            prompts[id] = content;
        }
    }

    return prompts;
}

export async function getPrompt(id: string): Promise<string> {
    const docRef = db.collection("prompts").doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return docSnap.data()!.content;
    } else {
        // Fallback to default if not in DB for some reason
        const defaultPrompts = await getPrompts();
        if (id in defaultPrompts) {
            return defaultPrompts[id];
        }
        throw new Error(`Prompt with id "${id}" not found!`);
    }
}

export async function savePrompt(id: string, content: string): Promise<void> {
    await db.collection("prompts").doc(id).set({ content });
}

// --- Watchlist Management ---

export interface WatchlistItem {
    id: string;
    userId: string;
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
    const watchlistCol = db.collection('watchlist');
    const q = watchlistCol.where("userId", "==", userId).orderBy("ticker");
    const watchlistSnapshot = await q.get();
    const watchlist: WatchlistItem[] = [];
    watchlistSnapshot.forEach(doc => {
        watchlist.push({ id: doc.id, ...(doc.data() as Omit<WatchlistItem, 'id'>) });
    });
    return watchlist;
}

export async function addWatchlistItem(item: Omit<WatchlistItem, 'id'>): Promise<string> {
    const docRef = await db.collection("watchlist").add(item);
    return docRef.id;
}

export async function removeWatchlistItem(id: string): Promise<void> {
    await db.collection("watchlist").doc(id).delete();
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

export async function getNewsFeed(): Promise<NewsItem[]> {
    const newsCol = db.collection('news_feed');
    const q = newsCol.orderBy("timestamp", "desc");
    const newsSnapshot = await q.get();
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


export async function addNewsItem(item: Omit<NewsItem, 'id' | 'timestamp' | 'analysis'>): Promise<string> {
    const newItem = {
        ...item,
        timestamp: Timestamp.now()
    };
    const docRef = await db.collection("news_feed").add(newItem);
    return docRef.id;
}


export async function saveNewsItemAnalysis(id: string, analysis: AnalyzeNewsSentimentOutput): Promise<void> {
    const newsItemRef = db.collection('news_feed').doc(id);
    await newsItemRef.update({ analysis });
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

export async function addUserProfile(data: NewUserProfile): Promise<void> {
    const userRef = db.collection("users").doc(data.uid);
    const userDoc = await userRef.get();
    const now = Timestamp.now();

    if (userDoc.exists) {
        await userRef.update({ 
            lastSeen: now,
            photoURL: data.photoURL || userDoc.data()?.photoURL || null
        });
        return;
    }

    const usersCol = db.collection('users');
    const userSnapshot = await usersCol.limit(3).get();
    const isEarlyUser = userSnapshot.size < 3;

    const newUserProfile = {
        email: data.email,
        uid: data.uid,
        photoURL: data.photoURL || null,
        role: isEarlyUser ? 'admin' : 'basic',
        createdAt: now,
        lastSeen: now,
    };
    
    await userRef.set(newUserProfile);
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
    const q = usersCol.orderBy("createdAt", "desc");
    const userSnapshot = await q.get();
    const users: UserProfile[] = [];
    userSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const plainObject: UserProfile = {
            uid: docSnap.id,
            email: data.email,
            role: data.role,
            photoURL: data.photoURL,
            createdAt: data.createdAt.toDate().toISOString(),
            lastSeen: data.lastSeen.toDate().toISOString(),
        };
        users.push(plainObject);
    });
    return users;
}


export async function addSampleUsers(): Promise<void> {
    const now = Timestamp.now();
    const usersBatch = db.batch();

    const sampleUsers: Omit<UserProfile, 'createdAt' | 'lastSeen' | 'uid' | 'photoURL'>[] = [
        { email: 'premium-user@example.com', role: 'premium' },
        { email: 'basic-user@example.com', role: 'basic' },
    ];
    
    const userRefs = sampleUsers.map(user => {
        const userRef = db.collection('users').doc();
        usersBatch.set(userRef, {
            ...user,
            uid: userRef.id,
            photoURL: `https://placehold.co/400x400.png`,
            createdAt: now,
            lastSeen: now,
        });
        return userRef;
    });

    await usersBatch.commit();
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
    const q = scannerCol.orderBy("createdAt", "desc");
    const scannerSnapshot = await q.get();
    const scanners: Scanner[] = [];
    scannerSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        scanners.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as Scanner);
    });
    return scanners;
}

export async function saveScanner(scanner: Omit<Scanner, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection('scanners').add({
        ...scanner,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateScanner(id: string, scanner: Partial<Scanner>): Promise<void> {
    await db.collection('scanners').doc(id).update(scanner);
}

// --- Data Source Management ---
export interface DataSource {
  id?: string;
  name: string;
  type: "API" | "WebSocket";
  url: string;
  isActive: boolean;
  createdAt: string;
}

export async function getDataSources(): Promise<DataSource[]> {
    const dataSourceCol = db.collection('data_sources');
    const q = dataSourceCol.orderBy("createdAt", "desc");
    const snapshot = await q.get();
    const dataSources: DataSource[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        dataSources.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as DataSource);
    });
    return dataSources;
}

export async function addDataSource(dataSource: Omit<DataSource, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await db.collection('data_sources').add({
        ...dataSource,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateDataSource(id: string, dataSource: Partial<Omit<DataSource, 'id' | 'createdAt'>>): Promise<void> {
    await db.collection('data_sources').doc(id).update(dataSource);
}


// --- DB Test ---
export async function addTestDocument(): Promise<string> {
    const docData = {
        message: "Database connection test successful!",
        timestamp: Timestamp.now(),
    };
    const docRef = await db.collection("test_writes").add(docData);
    return docRef.id;
}
