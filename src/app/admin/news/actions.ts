
"use server"

import { db, Timestamp } from "@/lib/firebase/server";
import { logActivity } from "@/services/logging";
import { addNewsItem, saveNewsItemAnalysis } from "@/services/firestore";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";

// --- News Source Management ---
export interface NewsSource {
  id?: string;
  name: string;
  type: "API" | "WebSocket";
  url: string;
  isActive: boolean;
  createdAt: string;
}

export async function getNewsSources(): Promise<NewsSource[]> {
    const newsSourceCol = db.collection('news_sources');
    const q = newsSourceCol.orderBy("createdAt", "desc");
    const snapshot = await q.get();
    const newsSources: NewsSource[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newsSources.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        } as NewsSource);
    });
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


export async function fetchNewsFromSources(): Promise<{ importedCount: number }> {
    const sources = await getNewsSources();
    const activeSources = sources.filter(s => s.isActive && s.type === 'API');
    let importedCount = 0;
    const analysisPromises: Promise<void>[] = [];

    for (const source of activeSources) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) {
                await logActivity("WARN", `Failed to fetch news from source: ${source.name}`, { status: response.status });
                continue;
            }
            const articles = await response.json();
            
            if (!Array.isArray(articles)) {
                 await logActivity("WARN", `News source did not return an array: ${source.name}`);
                 continue;
            }

            for (const article of articles) {
                // Basic validation
                if (!article.ticker || !article.headline || !article.content) {
                    continue;
                }
                
                const newsItemId = await addNewsItem({
                    ticker: article.ticker,
                    headline: article.headline,
                    content: article.content,
                    momentum: {
                        volume: article.momentum?.volume || "0",
                        relativeVolume: article.momentum?.relativeVolume || 0,
                        float: article.momentum?.float || "N/A",
                        shortInterest: article.momentum?.shortInterest || "N/A",
                        priceAction: article.momentum?.priceAction || "N/A"
                    }
                });
                importedCount++;

                // Trigger AI analysis asynchronously
                const analysisPromise = analyzeNewsSentiment({ 
                    ticker: article.ticker, 
                    headline: article.headline, 
                    content: article.content 
                }).then(analysis => {
                    return saveNewsItemAnalysis(newsItemId, analysis);
                }).catch(err => {
                    console.error(`Error analyzing news item ${newsItemId}:`, err);
                    logActivity("ERROR", `Failed to analyze news item for ${article.ticker}`, { id: newsItemId, error: (err as Error).message });
                });
                analysisPromises.push(analysisPromise);
            }
             await logActivity("INFO", `Fetched ${articles.length} articles from source: ${source.name}`);

        } catch (error) {
            console.error(`Error fetching from ${source.name}:`, error);
            await logActivity("ERROR", `Error fetching from news source: ${source.name}`, { error: (error as Error).message });
        }
    }
    
    // Wait for all analysis tasks to complete
    await Promise.all(analysisPromises);

    if (importedCount > 0) {
        await logActivity("INFO", `Completed analysis for ${analysisPromises.length} news items.`);
    }

    return { importedCount };
}
