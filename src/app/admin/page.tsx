
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ToggleRight, Newspaper, Bot, BarChart, Database, DatabaseZap, History, KeyRound } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Console</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              View, edit, and manage user accounts and subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5" />
              Feature Management
            </CardTitle>
            <CardDescription>
              Enable, disable, and configure premium features and subscription tiers.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/admin/features">Configure Features</Link>
             </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              News Source Management
            </CardTitle>
            <CardDescription>
              Add, manage, and delete news sources and ingestion settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/admin/news">Manage News Sources</Link>
             </Button>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Market Data Config
            </CardTitle>
            <CardDescription>
                Configure which market data points appear on news cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/market-data-config">Configure Data</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Prompt Management
            </CardTitle>
            <CardDescription>
              Create, test, and deploy new prompts for AI news analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/prompts">Manage Prompts</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Scanners Management
            </CardTitle>
            <CardDescription>
              Manage real-time scanners, and create new ones for users to purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/scanners">Manage Scanners</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseZap className="h-5 w-5" />
              Data Source Management
            </CardTitle>
            <CardDescription>
              Manage real-time market data sources and API connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/data-sources">Manage Data Sources</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                API Key Management
            </CardTitle>
            <CardDescription>
                Instructions for setting secure API key environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/api-keys">Set API Keys</Link>
            </Button>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              System Logs
            </CardTitle>
            <CardDescription>
              Review system-wide activity and error logs for diagnostics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/logs">View Logs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Test
            </CardTitle>
            <CardDescription>
              Perform a test write to the database to ensure connectivity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/admin/db-test">Run Test</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
