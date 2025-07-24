"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

// In a real app, these would be fetched from a database.
const initialPrompts: Record<string, string> = {
  summarizeMarketTrendsPrompt: `You are an AI assistant that summarizes market conditions and trends.

Summarize the market conditions and trends based on the following news feed:

{{newsFeed}}`,
  summarizeMomentumTrendsPrompt: `You are an AI assistant that summarizes market momentum.

Focus on identifying stocks with high relative volume, significant price changes, and breaking news. Highlight key movers and the reasons for their momentum based on the following news feed:

{{newsFeed}}`,
  analyzeNewsSentimentPrompt: `You are an AI-powered financial news analyst.

  Analyze the following news article to determine its sentiment and potential impact on the stock price.
  Provide a sentiment analysis (positive, negative, or neutral), an impact score from 1 to 100, and a brief summary of the news and its potential impact.

  Ticker: {{{ticker}}}
  Headline: {{{headline}}}
  Content: {{{content}}}`,
}

export default function PromptManagementPage() {
  const [selectedPrompt, setSelectedPrompt] = useState(Object.keys(initialPrompts)[0])
  const [promptContent, setPromptContent] = useState(initialPrompts[selectedPrompt])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePromptChange = (promptKey: string) => {
    setSelectedPrompt(promptKey)
    setPromptContent(initialPrompts[promptKey])
  }

  const handleSave = async () => {
    setLoading(true)
    // In a real app, you would save this to your database.
    // Here we'll just simulate an API call.
    await new Promise(resolve => setTimeout(resolve, 1000))
    initialPrompts[selectedPrompt] = promptContent
    setLoading(false)
    toast({
      title: "Prompt Saved",
      description: `The prompt "${selectedPrompt}" has been updated successfully.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prompt Management</CardTitle>
        <CardDescription>
          Select a prompt to view, edit, and save changes. Be careful when editing prompts as it can affect the AI's output.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="prompt-select" className="text-sm font-medium">Select Prompt</label>
          <Select value={selectedPrompt} onValueChange={handlePromptChange}>
            <SelectTrigger id="prompt-select" className="w-full md:w-[350px]">
              <SelectValue placeholder="Select a prompt" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(initialPrompts).map(key => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
           <label htmlFor="prompt-content" className="text-sm font-medium">Prompt Content</label>
          <Textarea
            id="prompt-content"
            value={promptContent}
            onChange={e => setPromptContent(e.target.value)}
            rows={15}
            className="font-mono text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
