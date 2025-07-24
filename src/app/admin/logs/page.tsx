
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { LogEntry } from "@/services/logging"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle, History } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db as clientDb } from '@/lib/firebase/client';


// This function sets up the real-time subscription to logs from Firestore.
function subscribeToLogs(callback: (logs: LogEntry[]) => void, logLimit: number = 50) {
  const logsCollection = collection(clientDb, 'logs');
  const q = query(logsCollection, orderBy("timestamp", "desc"), limit(logLimit));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const logs: LogEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp.toDate().toISOString(),
        severity: data.severity,
        action: data.action,
        details: data.details,
      });
    });
    callback(logs);
  }, (error) => {
    console.error("Error listening to logs:", error);
    // Optionally, inform the user with a toast notification
    // toast({ variant: "destructive", title: "Real-time logging failed." });
  });

  return unsubscribe;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToLogs((fetchedLogs) => {
      setLogs(fetchedLogs);
      if (loading) {
          setLoading(false);
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [toast, loading]);


  const getSeverityBadge = (severity: "INFO" | "WARN" | "ERROR") => {
    switch (severity) {
      case "INFO":
        return <Badge variant="secondary" className="items-center"><Info className="mr-1 h-3 w-3" />INFO</Badge>
      case "WARN":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 items-center"><AlertTriangle className="mr-1 h-3 w-3" />WARN</Badge>
      case "ERROR":
        return <Badge variant="destructive" className="items-center"><AlertTriangle className="mr-1 h-3 w-3" />ERROR</Badge>
      default:
        return <Badge variant="outline">UNKNOWN</Badge>
    }
  }

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "N/A";
    return `${formatDistanceToNow(new Date(dateString))} ago`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            System Logs
        </CardTitle>
        <CardDescription>
          A real-time record of system activities and events for diagnostics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[65vh] pr-4">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[120px]">Severity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No log entries found. System activity will appear here in real-time.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="font-medium text-sm">{log.action}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {log.details && Object.keys(log.details).length > 0 ? (
                        <pre className="whitespace-pre-wrap break-all text-xs bg-muted/50 p-2 rounded-md">
                            {JSON.stringify(log.details, null, 2)}
                        </pre>
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
