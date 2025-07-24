
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
        details: details || null,
    };
    const docRef = await db.collection("logs").add(logEntry);
    return docRef.id;
}


export async function getLogs(limit: number = 50): Promise<LogEntry[]> {
    const logsCol = db.collection('logs');
    const q = logsCol.orderBy("timestamp", "desc").limit(limit);
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
