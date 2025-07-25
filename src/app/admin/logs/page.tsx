
"use client"

import { useState, useEffect, useMemo } from "react"
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
import { format, subMinutes } from "date-fns"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle, History, LineChart, PieChart, BarChart, ShoppingCart } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db as clientDb } from '@/lib/firebase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ResponsiveContainer } from "recharts"


// This function sets up the real-time subscription to logs from Firestore.
function subscribeToLogs(callback: (logs: LogEntry[]) => void, logLimit: number = 200) {
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

const severityColors: { [key in LogEntry['severity']]: string } = {
  INFO: 'hsl(var(--chart-2))',
  WARN: 'hsl(var(--chart-4))',
  ERROR: 'hsl(var(--chart-5))',
};

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

  const chartData = useMemo(() => {
    const severityCounts = { INFO: 0, WARN: 0, ERROR: 0 };
    const actionCounts: { [key: string]: number } = {};
    const ingestionVolumes: { time: string, volume: number }[] = [];
    const marketDataRequests: { [ticker: string]: number } = {};

    logs.forEach(log => {
        // Severity
        if (log.severity in severityCounts) {
            severityCounts[log.severity]++;
        }
        // Action
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

        // Ingestion Volume
        if (log.action.startsWith("Fetched from source") && log.details?.dataVolume) {
            const volume = parseInt(log.details.dataVolume.split(' ')[0], 10);
            if (!isNaN(volume)) {
                ingestionVolumes.push({ time: log.timestamp, volume });
            }
        }
        
        // Market Data requests
        if (log.action.startsWith("Fetched stock data for") && log.details?.ticker) {
            marketDataRequests[log.details.ticker] = (marketDataRequests[log.details.ticker] || 0) + 1;
        }
    });

    const severityChartData = Object.entries(severityCounts).map(([name, value]) => ({ name, value, fill: severityColors[name as LogEntry['severity']] }));

    const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value, fill: "var(--color-value)" }));
    
    const topMarketRequests = Object.entries(marketDataRequests).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value, fill: "var(--color-value)" }));
    
    // Group ingestion volume by minute
    const now = new Date();
    const timeWindow = 30; // 30 minutes
    const volumeByMinute: { [key: string]: number } = {};

    ingestionVolumes
        .filter(d => new Date(d.time) > subMinutes(now, timeWindow))
        .forEach(d => {
            const minute = format(new Date(d.time), 'HH:mm');
            volumeByMinute[minute] = (volumeByMinute[minute] || 0) + d.volume;
        });

    const ingestionChartData = Object.entries(volumeByMinute).map(([time, volume]) => ({ name: time, Volume: volume / 1024 })).sort((a,b) => a.name.localeCompare(b.name));


    return { severityChartData, topActions, ingestionChartData, topMarketRequests };

  }, [logs]);


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
  
  const chartConfig = {
      value: { label: "Count", color: "hsl(var(--chart-1))" },
      Volume: { label: "KB", color: "hsl(var(--chart-1))" },
      INFO: { label: "Info", color: "hsl(var(--chart-2))" },
      WARN: { label: "Warning", color: "hsl(var(--chart-3))" },
      ERROR: { label: "Error", color: "hsl(var(--chart-5))" },
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><PieChart className="h-5 w-5"/>Log Severity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
                        <RechartsPieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={chartData.severityChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                {chartData.severityChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </RechartsPieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><LineChart className="h-5 w-5"/>Ingestion Volume (KB)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <RechartsLineChart data={chartData.ingestionChartData} margin={{ left: -10, right: 20, top: 5, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                             <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                             <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                             <Line dataKey="Volume" type="monotone" stroke="var(--color-Volume)" strokeWidth={2} dot={false} />
                        </RechartsLineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><BarChart className="h-5 w-5"/>Top Actions</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <RechartsBarChart data={chartData.topActions} layout="vertical" margin={{ left: 20, right: 20 }}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, width: 150 }} width={150} />
                             <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                             <Bar dataKey="value" layout="vertical" radius={5} fill="hsl(var(--primary))" />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ShoppingCart className="h-5 w-5"/>Market Data Requests</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <RechartsBarChart data={chartData.topMarketRequests} layout="vertical" margin={{ left: 0, right: 20 }}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={60}/>
                             <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                             <Bar dataKey="value" layout="vertical" radius={5} fill="hsl(var(--accent))" />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
           
        </div>
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
            <ScrollArea className="h-[60vh] pr-4">
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
    </div>
  )
}
