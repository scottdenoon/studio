
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
import { Loader2, Edit, CheckCircle, Rss, Info, PlusCircle, Trash2, Key, Clock, Filter } from "lucide-react"
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
  fetchNewsFromSources,
} from "./actions"
import { NewsSource } from "./actions"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const fieldMappingSchema = z.object({
  dbField: z.string().min(1, "Required"),
  sourceField: z.string().min(1, "Required"),
});

const keywordSchema = z.object({ value: z.string().min(1, "Keyword cannot be empty") });

const newsSourceSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(["API", "WebSocket"]),
  url: z.string().url("Must be a valid URL"),
  isActive: z.boolean().default(true),
  apiKeyEnvVar: z.string().optional(),
  fieldMapping: z.array(fieldMappingSchema).optional(),
  isFieldMappingEnabled: z.boolean().default(false),
  frequency: z.coerce.number().min(1, "Frequency must be at least 1").optional(),
  filters: z.object({
    includeKeywords: z.array(keywordSchema).optional(),
    excludeKeywords: z.array(keywordSchema).optional(),
  }).optional(),
})

type NewsSourceFormValues = z.infer<typeof newsSourceSchema>

const dbFields = [
  "ticker", "headline", "content", 
  "momentum.volume", "momentum.relativeVolume", "momentum.float",
  "momentum.shortInterest", "momentum.priceAction"
];

const KeywordArrayInput = ({ name, control, label }: { name: "filters.includeKeywords" | "filters.excludeKeywords", control: any, label: string }) => {
    const { fields, append, remove } = useFieldArray({ control, name });

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`${name}.${index}.value`}
                        render={({ field }) => (
                            <Input {...field} placeholder="Enter keyword..." />
                        )}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => append({ value: "" })}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add
            </Button>
        </div>
    );
}

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
      isFieldMappingEnabled: false,
      frequency: 5,
      filters: { includeKeywords: [], excludeKeywords: [] },
    },
  })
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fieldMapping",
  });

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
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
        description: `Imported ${result.importedCount} new articles. Filtered out ${result.filteredCount}.`
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
      fetchSources()
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
      fieldMapping: source.fieldMapping || [],
      isFieldMappingEnabled: source.isFieldMappingEnabled || false,
      filters: {
        includeKeywords: source.filters?.includeKeywords?.map(v => ({value: v as any})) || [],
        excludeKeywords: source.filters?.excludeKeywords?.map(v => ({value: v as any})) || []
      }
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
      isFieldMappingEnabled: false,
      frequency: 5,
      filters: { includeKeywords: [], excludeKeywords: [] },
    })
  }

  const onSubmit = async (data: NewsSourceFormValues) => {
    setLoading(true)
    
    // Transform filters from {value: string}[] to string[] before saving
    const dataToSave = {
        ...data,
        filters: {
            includeKeywords: data.filters?.includeKeywords?.map(k => k.value),
            excludeKeywords: data.filters?.excludeKeywords?.map(k => k.value)
        }
    };

    try {
      if (editingId) {
        await updateNewsSource(editingId, dataToSave)
        toast({
          title: "News Source Updated",
          description: "The news source has been successfully updated.",
        })
      } else {
        await addNewsSource(dataToSave)
        toast({
          title: "News Source Added",
          description: "The new news source has been added.",
        })
      }
      handleCancelEdit()
      fetchSources()
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
                        <SelectItem value="WebSocket">WebSocket</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl><Input placeholder={form.getValues("type") === "WebSocket" ? "wss://socket.example.com" : "https://api.example.com/news"} {...field} /></FormControl>
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

                <FormField control={form.control} name="frequency" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Frequency (minutes)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base">Field Mapping</CardTitle>
                                <CardDescription className="text-xs">Map database fields to source API fields.</CardDescription>
                            </div>
                             <FormField control={form.control} name="isFieldMappingEnabled" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="text-xs">Enabled</FormLabel>
                                </FormItem>
                            )} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0">
                        <Button type="button" size="sm" variant="outline" onClick={() => append({ dbField: "", sourceField: "" })} className="w-full">
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Mapping
                        </Button>
                       <div className="space-y-2 max-h-60 overflow-y-auto p-1">
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
                       </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                         <CardTitle className="text-base">Content Filters (Optional)</CardTitle>
                         <CardDescription className="text-xs">Filter articles by keywords before they are saved.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        <KeywordArrayInput name="filters.includeKeywords" control={form.control} label="Include if keyword exists" />
                        <KeywordArrayInput name="filters.excludeKeywords" control={form.control} label="Exclude if keyword exists" />
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
              Fetch News From API Sources
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
                  <TableHead>Filters</TableHead>
                  <TableHead>Mappings</TableHead>
                  <TableHead>Freq (min)</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
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
                            <Filter className="h-3 w-3" />
                            {(source.filters?.includeKeywords?.length || 0) + (source.filters?.excludeKeywords?.length || 0)}
                          </Badge>
                      </TableCell>
                       <TableCell>
                          <Badge variant={source.isFieldMappingEnabled ? "default" : "outline"} className="flex items-center gap-1.5">
                            <Key className="h-3 w-3" />
                            {source.fieldMapping?.length || 0}
                          </Badge>
                      </TableCell>
                       <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {source.frequency || 'N/A'}
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
                    <TableCell colSpan={7} className="h-24 text-center">
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
