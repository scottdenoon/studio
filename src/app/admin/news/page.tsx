
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { addNewsItem, NewsItem } from "@/services/firestore"
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment"
import { saveNewsItemAnalysis } from "@/services/firestore"

const newsItemSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  headline: z.string().min(1, "Headline is required"),
  content: z.string().min(1, "Content is required"),
  momentum: z.object({
      volume: z.string().min(1, "Volume is required"),
      relativeVolume: z.coerce.number().min(0, "Relative Volume must be positive"),
      float: z.string().min(1, "Float is required"),
      shortInterest: z.string().min(1, "Short Interest is required"),
      priceAction: z.string().min(1, "Price Action is required"),
  }),
})

type NewsItemFormValues = z.infer<typeof newsItemSchema>

export default function NewsManagementPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<NewsItemFormValues>({
    resolver: zodResolver(newsItemSchema),
    defaultValues: {
      ticker: "",
      headline: "",
      content: "",
      momentum: {
        volume: "",
        relativeVolume: 1.0,
        float: "",
        shortInterest: "",
        priceAction: "",
      },
    },
  })

  const onSubmit = async (data: NewsItemFormValues) => {
    setLoading(true)
    try {
      // The `addNewsItem` function now only needs the form data.
      // It will handle creating the full NewsItem object with timestamp.
      const newsId = await addNewsItem(data);

      // Now, trigger the AI analysis and save it
      try {
        const analysis = await analyzeNewsSentiment({
          ticker: data.ticker,
          headline: data.headline,
          content: data.content,
        });
        await saveNewsItemAnalysis(newsId, analysis);
        toast({
            title: "News Item Added & Analyzed",
            description: `The news item for "${data.ticker}" has been added and analyzed successfully.`,
        });
      } catch (analysisError) {
         console.error("Error analyzing news item:", analysisError)
         toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The news item was added, but AI analysis failed.",
         })
      }

      form.reset()
    } catch (error) {
      console.error("Error saving news item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the news item.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add News Item</CardTitle>
        <CardDescription>
          Fill out the form below to add a new article to the real-time news feed. AI analysis will be triggered automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="ticker"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ticker</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., AAPL" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Enter news headline..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                            <Textarea rows={8} placeholder="Enter full news content..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Momentum Data</h3>
                    <FormField
                    control={form.control}
                    name="momentum.volume"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Volume</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 50.2M" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="momentum.relativeVolume"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Relative Volume</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="momentum.float"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Float</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 1.2B" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="momentum.shortInterest"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Short Interest</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 5.3%" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="momentum.priceAction"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price Action</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Breaking out above resistance" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add News Item"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
