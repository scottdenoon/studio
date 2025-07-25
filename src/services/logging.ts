
"use server"

import { db, Timestamp } from "@/lib/firebase/server";

export interface LogEntry {
    id?: string;
    timestamp: string;
    severity: "INFO" | "WARN" | "ERROR";
    action: string;
    details?: Record<string, any>;
}

export async function logActivity(severity: LogEntry['severity'], action: string, details?: Record<string, any>): Promise<string> {
    const logEntry = {
        timestamp: Timestamp.now(),
        severity,
        action,
        details: details || {}, // Ensure details is always an object
    };
    const docRef = await db.collection("logs").add(logEntry);
    // We don't await this log to avoid infinite loops if logging fails
    if (action !== "logActivity failed") {
        try {
            // Don't log the log itself to avoid noise
        } catch (e) {
            console.error("Failed to log the logActivity event itself. This is to prevent loops.", e);
        }
    }
    return docRef.id;
}


export async function getLogs(count: number = 50): Promise<LogEntry[]> {
    const logsCol = db.collection('logs');
    const q = logsCol.orderBy("timestamp", "desc").limit(count);
    const logsSnapshot = await q.get();
    const logs: LogEntry[] = [];
    logsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        logs.push({
            id: docSnap.id,
            timestamp: data.timestamp.toDate().toISOString(),
            severity: data.severity,
            action: data.action,
            details: data.details,
        });
    });
    return logs;
}
