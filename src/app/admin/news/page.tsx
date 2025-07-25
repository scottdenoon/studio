
"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Edit, CheckCircle, Rss, Info, PlusCircle, Trash2, Key } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  addNewsSource,
  getNewsSources,
  updateNewsSource,
  NewsSource,
  fetchNewsFromSources,
} from "./actions"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const fieldMappingSchema = z.object({
  dbField: z.string().min(1, "Required"),
  sourceField: z.string().min(1, "Required"),
});

const newsSourceSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(["API", "WebSocket"]),
  url: z.string().url("Must be a valid URL"),
  isActive: z.boolean().default(true),
  apiKeyEnvVar: z.string().optional(),
  fieldMapping: z.array(fieldMappingSchema).optional(),
})

type NewsSourceFormValues = z.infer<typeof newsSourceSchema>

const dbFields = [
  "ticker", "headline", "content", 
  "momentum.volume", "momentum.relativeVolume", "momentum.float",
  "momentum.shortInterest", "momentum.priceAction"
];

export default function NewsSourceManagementPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [newsSources, setNewsSources] = useState<NewsSource[]>([])
  const [loadingNewsSources, setLoadingNewsSources] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<NewsSourceFormValues>({
    resolver: zodResolver(newsSourceSchema),
    defaultValues: {
      name: "",
      type: "API",
      url: "",
      isActive: true,
      apiKeyEnvVar: "",
      fieldMapping: [],
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fieldMapping",
  });

  useEffect(() => {
    fetchNewsSources()
  }, [])

  const fetchNewsSources = async () => {
    setLoadingNewsSources(true)
    try {
      const fetchedNewsSources = await getNewsSources()
      setNewsSources(fetchedNewsSources)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch news sources.",
      })
    } finally {
      setLoadingNewsSources(false)
    }
  }

  const handleFetchNews = async () => {
    setFetching(true);
    try {
      const result = await fetchNewsFromSources();
      toast({
        title: "News Ingestion Complete",
        description: `Successfully fetched and processed ${result.importedCount} new articles.`
      })
    } catch (error) {
      console.error("Error fetching news from sources:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch news from sources." });
    } finally {
      setFetching(false);
    }
  }

  const handleToggleActive = async (source: NewsSource) => {
    try {
      await updateNewsSource(source.id!, { isActive: !source.isActive })
      toast({
        title: "Status Updated",
        description: `${source.name} has been ${!source.isActive ? 'activated' : 'deactivated'}.`,
      })
      fetchNewsSources()
    } catch (error) {
      console.error("Error toggling status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the status.",
      })
    }
  }

  const handleEdit = (source: NewsSource) => {
    setEditingId(source.id!)
    form.reset({
      ...source,
      fieldMapping: source.fieldMapping || []
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    form.reset({
      name: "",
      type: "API",
      url: "",
      isActive: true,
      apiKeyEnvVar: "",
      fieldMapping: [],
    })
  }

  const onSubmit = async (data: NewsSourceFormValues) => {
    setLoading(true)
    try {
      if (editingId) {
        await updateNewsSource(editingId, data)
        toast({
          title: "News Source Updated",
          description: "The news source has been successfully updated.",
        })
      } else {
        await addNewsSource(data)
        toast({
          title: "News Source Added",
          description: "The new news source has been added.",
        })
      }
      handleCancelEdit()
      fetchNewsSources()
    } catch (error) {
      console.error("Error saving news source:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the news source.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit News Source" : "Add News Source"}</CardTitle>
            <CardDescription>
              {editingId ? "Modify an existing news source." : "Add a new source for news ingestion."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Benzinga News" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="API">API</SelectItem>
                        <SelectItem value="WebSocket" disabled>WebSocket</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl><Input placeholder="https://api.example.com/news" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="apiKeyEnvVar" render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key Variable (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. NEWS_API_KEY_1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          Field Mapping (Optional)
                          <Button type="button" size="sm" variant="outline" onClick={() => append({ dbField: "", sourceField: "" })}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-xs">Map database fields to source API fields.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-60 overflow-y-auto p-2">
                       {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <FormField control={form.control} name={`fieldMapping.${index}.dbField`} render={({ field }) => (
                               <FormItem className="flex-1">
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="DB Field" /></SelectTrigger></FormControl>
                                  <SelectContent>{dbFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                               </FormItem>
                            )} />
                             <FormField control={form.control} name={`fieldMapping.${index}.sourceField`} render={({ field }) => (
                               <FormItem className="flex-1">
                                <FormControl><Input placeholder="Source Field (e.g. article.title)" {...field} /></FormControl>
                                <FormMessage className="text-xs" />
                                </FormItem>
                             )} />
                             <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                             </Button>
                          </div>
                       ))}
                       {fields.length === 0 && (
                          <p className="text-center text-xs text-muted-foreground py-4">No field mappings defined.</p>
                       )}
                    </CardContent>
                </Card>

                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? "Update Source" : "Add Source"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed Status</CardTitle>
            <CardDescription>Live status of your active news feeds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleFetchNews} disabled={fetching} className="w-full">
              {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rss className="mr-2 h-4 w-4" />}
              Fetch News From Sources
            </Button>
            <Separator />
            {loadingNewsSources ? <Skeleton className="h-24 w-full" /> :
              newsSources.filter(ds => ds.isActive).length > 0 ? (
                newsSources.filter(ds => ds.isActive).map((source) => (
                  <div key={source.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{source.name}</span>
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Operational</span>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-8">No active news sources.</p>
              )
            }
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Managing API Keys</AlertTitle>
            <AlertDescription>
                API keys are stored as server-side environment variables for security. You can add them in your Firebase App Hosting settings.
                <Button variant="link" asChild className="p-0 h-auto ml-1"><Link href="/admin/api-keys">Learn More</Link></Button>
            </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Configured News Sources</CardTitle>
            <CardDescription>A list of all currently configured news sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mappings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingNewsSources ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : newsSources.length > 0 ? (
                  newsSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.name}</TableCell>
                      <TableCell><Badge variant="secondary">{source.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={source.isActive ? "default" : "destructive"}>
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                       <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1.5">
                            <Key className="h-3 w-3" />
                            {source.fieldMapping?.length || 0}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={source.isActive}
                            onCheckedChange={() => handleToggleActive(source)}
                            aria-label="Toggle active status"
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(source)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No news sources configured yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
