
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
import { getLogs, LogEntry } from "@/services/logging"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle, History } from "lucide-react"

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const fetchedLogs = await getLogs()
        setLogs(fetchedLogs)
      } catch (error) {
        console.error("Error fetching logs:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load system logs.",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [toast])

  const getSeverityBadge = (severity: "INFO" | "WARN" | "ERROR") => {
    switch (severity) {
      case "INFO":
        return <Badge variant="secondary"><Info className="mr-1 h-3 w-3" />INFO</Badge>
      case "WARN":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600"><AlertTriangle className="mr-1 h-3 w-3" />WARN</Badge>
      case "ERROR":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />ERROR</Badge>
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
          A chronological record of system activities and events for diagnostics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
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
                  No log entries found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs">{formatTimestamp(log.timestamp)}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {log.details ? JSON.stringify(log.details) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
