

"use server"

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc, query, orderBy, where, Timestamp } from "firebase/firestore";

// --- Prompt Management ---

export async function getPrompts(): Promise<Record<string, string>> {
    const promptsCol = collection(db, 'prompts');
    const promptSnapshot = await getDocs(promptsCol);
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
    const docRef = doc(db, "prompts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().content;
    } else {
        throw new Error("No such document!");
    }
}

export async function savePrompt(id: string, content: string): Promise<void> {
    await setDoc(doc(db, "prompts", id), { content });
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
    const watchlistCol = collection(db, 'watchlist');
    const q = query(watchlistCol, where("userId", "==", userId), orderBy("ticker"));
    const watchlistSnapshot = await getDocs(q);
    const watchlist: WatchlistItem[] = [];
    watchlistSnapshot.forEach(doc => {
        watchlist.push({ id: doc.id, ...(doc.data() as Omit<WatchlistItem, 'id'>) });
    });
    return watchlist;
}

export async function addWatchlistItem(item: Omit<WatchlistItem, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "watchlist"), item);
    return docRef.id;
}

export async function removeWatchlistItem(id: string): Promise<void> {
    await deleteDoc(doc(db, "watchlist", id));
}


// --- News Feed Management ---

export interface NewsItem {
    id?: string;
    ticker: string;
    headline: string;
    content: string;
    timestamp: string; // Changed to string for serialization
    momentum: {
        volume: string;
        relativeVolume: number;
        float: string;
        shortInterest: string;
        priceAction: string;
    };
}

export async function getNewsFeed(): Promise<NewsItem[]> {
    const newsCol = collection(db, 'news_feed');
    const q = query(newsCol, orderBy("timestamp", "desc"));
    const newsSnapshot = await getDocs(q);
    const newsFeed: NewsItem[] = [];
    newsSnapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toISOString() 
            : (typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString());
        newsFeed.push({
            id: doc.id,
            ticker: data.ticker,
            headline: data.headline,
            content: data.content,
            momentum: data.momentum,
            timestamp: timestamp,
        });
    });
    return newsFeed;
}

export async function addNewsItem(item: Omit<NewsItem, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await addDoc(collection(db, "news_feed"), {
        ...item,
        timestamp: new Date().toISOString(),
    });
    return docRef.id;
}

// --- User Management ---

export interface UserProfile {
    uid: string;
    email: string;
    role: 'admin' | 'basic' | 'premium';
    createdAt: string; // Changed to string for serialization
    lastSeen: string; // Changed to string for serialization
}

export async function addUser(user: { uid: string, email: string, role: 'admin' | 'basic' }): Promise<void> {
    const now = new Date().toISOString();
    const userProfile = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      createdAt: now,
      lastSeen: now,
    };
    await setDoc(doc(db, "users", user.uid), userProfile);
}

export async function getUsers(): Promise<UserProfile[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("createdAt", "desc"));
    const userSnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    userSnapshot.forEach(doc => {
        const data = doc.data();
        // Ensure timestamps are correctly converted to ISO strings
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
        const lastSeen = data.lastSeen instanceof Timestamp ? data.lastSeen.toDate().toISOString() : (data.lastSeen || new Date().toISOString());

        users.push({
            uid: data.uid,
            email: data.email,
            role: data.role,
            createdAt: createdAt,
            lastSeen: lastSeen,
        });
    });
    return users;
}
