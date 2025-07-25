
"use client"

import { useState, useEffect } from "react"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Edit, CheckCircle, AlertTriangle } from "lucide-react"
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
import { addDataSource, getDataSources, updateDataSource, DataSource } from "@/services/firestore"
import { Separator } from "@/components/ui/separator"

const dataSourceSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(["API", "WebSocket"]),
  url: z.string().url("Must be a valid URL"),
  isActive: z.boolean().default(true),
  frequency: z.coerce.number().min(1, "Frequency must be at least 1").optional(),
})

type DataSourceFormValues = z.infer<typeof dataSourceSchema>

export default function DataSourceManagementPage() {
  const [loading, setLoading] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loadingDataSources, setLoadingDataSources] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<DataSourceFormValues>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: "",
      type: "API",
      url: "",
      isActive: true,
      frequency: 5,
    },
  })

  useEffect(() => {
    fetchDataSources()
  }, [])

  const fetchDataSources = async () => {
    setLoadingDataSources(true)
    try {
      const fetchedDataSources = await getDataSources()
      setDataSources(fetchedDataSources)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch data sources.",
      })
    } finally {
      setLoadingDataSources(false)
    }
  }
  
  const handleToggleActive = async (source: DataSource) => {
      try {
        await updateDataSource(source.id!, { isActive: !source.isActive })
        toast({ title: "Status Updated", description: `${source.name} has been ${!source.isActive ? 'activated' : 'deactivated'}.`})
        fetchDataSources()
      } catch (error) {
        console.error("Error toggling status:", error)
        toast({ variant: "destructive", title: "Error", description: "Could not update the status." })
      }
  }

  const handleEdit = (source: DataSource) => {
    setEditingId(source.id!)
    form.reset(source)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    form.reset({
      name: "",
      type: "API",
      url: "",
      isActive: true,
      frequency: 5,
    })
  }

  const onSubmit = async (data: DataSourceFormValues) => {
    setLoading(true)
    try {
      if (editingId) {
        await updateDataSource(editingId, data)
        toast({
          title: "Data Source Updated",
          description: "The data source has been successfully updated.",
        })
      } else {
        await addDataSource(data)
        toast({
          title: "Data Source Added",
          description: "The new data source has been added.",
        })
      }
      handleCancelEdit()
      fetchDataSources()
    } catch (error) {
      console.error("Error saving data source:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the data source.",
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
            <CardTitle>{editingId ? "Edit Data Source" : "Add Data Source"}</CardTitle>
            <CardDescription>
              {editingId ? "Modify an existing data source." : "Add a new data source for market data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Polygon.io" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="https://api.example.com" {...field} /></FormControl>
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
                <CardDescription>Live status of your active data feeds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDataSources ? <Skeleton className="h-24 w-full" /> : 
                dataSources.filter(ds => ds.isActive).length > 0 ? (
                  dataSources.filter(ds => ds.isActive).map((source) => (
                    <div key={source.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{source.name}</span>
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Operational</span>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Latency: 45ms</div>
                        <Separator />
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-center text-muted-foreground py-8">No active data sources.</p>
                )
              }
            </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Configured Data Sources</CardTitle>
            <CardDescription>A list of all currently configured data sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDataSources ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : dataSources.length > 0 ? (
                  dataSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.name}</TableCell>
                      <TableCell><Badge variant="secondary">{source.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={source.isActive ? "default" : "destructive"}>
                          {source.isActive ? "Active" : "Inactive"}
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
                    <TableCell colSpan={4} className="h-24 text-center">
                      No data sources configured yet.
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
