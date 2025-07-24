import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ToggleRight, Newspaper, Bot, BarChart } from "lucide-react";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Console</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <Button>Manage Users</Button>
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
            <Button>Configure Features</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              News Feed Management
            </CardTitle>
            <CardDescription>
              Add, manage, and delete news sources and ingestion settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Manage News Feeds</Button>
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
            <Button>Manage Prompts</Button>
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
            <Button>Manage Scanners</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
