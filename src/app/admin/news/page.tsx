
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatDistanceToNow } from "date-fns"
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
import { Loader2, Edit, Trash2 } from "lucide-react"
import {
  addNewsItem,
  getNewsFeed,
  updateNewsItem,
  deleteNewsItem,
  NewsItem,
  NewsItemCreate,
} from "@/services/firestore"
import { analyzeNewsSentiment } from "@/ai/flows/analyze-news-sentiment"
import { saveNewsItemAnalysis } from "@/services/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
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

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    setLoadingNews(true)
    try {
      const items = await getNewsFeed()
      setNewsItems(items)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch news items.",
      })
    } finally {
      setLoadingNews(false)
    }
  }
  
  const triggerAnalysis = async (newsId: string, data: NewsItemCreate) => {
    try {
        const analysis = await analyzeNewsSentiment({
          ticker: data.ticker,
          headline: data.headline,
          content: data.content,
        });
        await saveNewsItemAnalysis(newsId, analysis);
        toast({
            title: "AI Analysis Triggered",
            description: `The news item for "${data.ticker}" is being analyzed.`,
        });
      } catch (analysisError) {
         console.error("Error analyzing news item:", analysisError)
         toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The AI analysis process failed to start.",
         })
      }
  }

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id!)
    form.reset(item)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    form.reset({
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
    })
  }
  
  const handleDelete = async (id: string) => {
    try {
      await deleteNewsItem(id)
      toast({ title: "News Item Deleted", description: "The article has been removed."})
      fetchNews()
    } catch (error) {
      console.error("Error deleting news item:", error)
      toast({ variant: "destructive", title: "Error", description: "Could not delete the news item." })
    }
  }

  const onSubmit = async (data: NewsItemFormValues) => {
    setLoading(true)
    try {
      if (editingId) {
        await updateNewsItem(editingId, data)
        toast({ title: "News Item Updated", description: "The article has been updated." })
        triggerAnalysis(editingId, data)
      } else {
        const newsId = await addNewsItem(data)
        toast({ title: "News Item Added", description: "The new article has been added." })
        triggerAnalysis(newsId, data)
      }
      handleCancelEdit()
      fetchNews()
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
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit News Item" : "Add News Item"}</CardTitle>
            <CardDescription>
              {editingId ? "Modify an existing article." : "Add a new article to the feed. AI analysis will be triggered automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="ticker" render={({ field }) => (
                    <FormItem><FormLabel>Ticker</FormLabel><FormControl><Input placeholder="e.g., AAPL" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="headline" render={({ field }) => (
                    <FormItem><FormLabel>Headline</FormLabel><FormControl><Textarea placeholder="Enter news headline..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea rows={6} placeholder="Enter full news content..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Momentum Data</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="momentum.volume" render={({ field }) => (
                            <FormItem><FormLabel>Volume</FormLabel><FormControl><Input placeholder="e.g., 50.2M" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="momentum.relativeVolume" render={({ field }) => (
                            <FormItem><FormLabel>Rel. Volume</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="momentum.float" render={({ field }) => (
                            <FormItem><FormLabel>Float</FormLabel><FormControl><Input placeholder="e.g., 1.2B" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="momentum.shortInterest" render={({ field }) => (
                            <FormItem><FormLabel>Short Interest</FormLabel><FormControl><Input placeholder="e.g., 5.3%" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="momentum.priceAction" render={({ field }) => (
                            <FormItem className="sm:col-span-2"><FormLabel>Price Action</FormLabel><FormControl><Input placeholder="e.g., Breaking out above resistance" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? "Update Article" : "Add Article"}
                    </Button>
                    {editingId && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
            <CardHeader>
                <CardTitle>News Feed</CardTitle>
                <CardDescription>A list of all current news articles.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[720px]">
                    {loadingNews ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : newsItems.length === 0 ? (
                        <Alert>
                            <AlertTitle>No News Items</AlertTitle>
                            <AlertDescription>The news feed is empty. Add an article using the form.</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {newsItems.map(item => (
                                <div key={item.id} className="flex items-start justify-between rounded-lg border p-3 gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge>{item.ticker}</Badge>
                                            <p className="text-sm font-semibold truncate">{item.headline}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the news article.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(item.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
