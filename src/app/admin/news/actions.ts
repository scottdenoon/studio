
"use server"

import { db, Timestamp } from "@/lib/firebase/server";
import { logActivity } from "@/services/logging";
import { addNewsItem, saveNewsItemAnalysis } from "@/services/firestore";
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment";
import { ingestNewsData, IngestNewsDataInput } from "@/ai/flows/ingest-news-data";

// --- News Source Management ---
export interface FieldMapping {
    dbField: string;
    sourceField: string;
}

export interface NewsSourceFilters {
    includeKeywords?: string[];
    excludeKeywords?: string[];
}

export interface NewsSource {
  id?: string;
  name: string;
  type: "API" | "WebSocket";
  url: string;
  isActive: boolean;
  createdAt: string;
  apiKeyEnvVar?: string;
  fieldMapping?: FieldMapping[];
  frequency?: number;
  filters?: NewsSourceFilters;
}

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


export async function fetchNewsFromSources(): Promise<{ importedCount: number, filteredCount: number }> {
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
            if (source.fieldMapping && source.fieldMapping.length > 0) {
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
                const newsItemId = await addNewsItem({
                    ticker: article.ticker,
                    headline: article.headline,
                    content: article.content,
                    momentum: article.momentum,
                });
                totalImportedCount++;

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
