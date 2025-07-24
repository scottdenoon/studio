

"use server"

import { db } from "@/lib/firebase/server";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc, query, orderBy, where, Timestamp, limit, updateDoc } from "firebase/firestore";
import { AnalyzeNewsSentimentOutput } from "@/ai/flows/analyze-news-sentiment";

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
    const newsCol = collection(db, 'news_feed');
    const q = query(newsCol, orderBy("timestamp", "desc"));
    const newsSnapshot = await getDocs(q);
    const newsFeed: NewsItem[] = [];
    newsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        let timestamp;
        if (data.timestamp && data.timestamp instanceof Timestamp) {
            timestamp = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'string') {
            timestamp = data.timestamp;
        } else {
            timestamp = new Date().toISOString();
        }

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
        timestamp: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "news_feed"), newItem);
    return docRef.id;
}


export async function saveNewsItemAnalysis(id: string, analysis: AnalyzeNewsSentimentOutput): Promise<void> {
    const newsItemRef = doc(db, 'news_feed', id);
    await updateDoc(newsItemRef, { analysis });
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
    const userRef = doc(db, "users", data.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        await setDoc(userRef, { lastSeen: new Date().toISOString() }, { merge: true });
        return;
    }

    const usersCol = collection(db, 'users');
    const q = query(usersCol, limit(1));
    const userSnapshot = await getDocs(q);
    const isFirstUser = userSnapshot.empty;
    
    const now = new Date().toISOString();
    
    const newUserProfile = {
        email: data.email,
        uid: data.uid,
        photoURL: data.photoURL || null,
        role: isFirstUser ? 'admin' : 'basic',
        createdAt: now,
        lastSeen: now,
    };
    
    await setDoc(userRef, newUserProfile);
}


export async function getUser(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    const data = docSnap.data();
    const plainObject: UserProfile = {
        uid: docSnap.id,
        email: data.email,
        role: data.role,
        photoURL: data.photoURL,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        lastSeen: data.lastSeen instanceof Timestamp ? data.lastSeen.toDate().toISOString() : data.lastSeen,
    };
    return plainObject;
}

export async function getUsers(): Promise<UserProfile[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("createdAt", "desc"));
    const userSnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    userSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const plainObject: UserProfile = {
            uid: docSnap.id,
            email: data.email,
            role: data.role,
            photoURL: data.photoURL,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastSeen: data.lastSeen instanceof Timestamp ? data.lastSeen.toDate().toISOString() : data.lastSeen,
        };
        users.push(plainObject);
    });
    return users;
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
    const docRef = await addDoc(collection(db, "alerts"), {
        ...item,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}


// --- DB Test ---
export async function addTestDocument(): Promise<string> {
    const docData = {
        message: "Database connection test successful!",
        timestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "test_writes"), docData);
    return docRef.id;
}
