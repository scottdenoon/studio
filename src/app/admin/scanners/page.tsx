
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
import { Loader2, PlusCircle, Trash2, Edit, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { getScanners, saveScanner, updateScanner } from "@/app/actions"
import { Scanner } from "@/services/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

const scannerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description is required"),
  isActive: z.boolean().default(true),
  criteria: z.object({
    minVolume: z.coerce.number().optional(),
    minRelativeVolume: z.coerce.number().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    minMarketCap: z.coerce.number().optional(),
    maxMarketCap: z.coerce.number().optional(),
    newsRequired: z.boolean().default(false),
  }),
})

type ScannerFormValues = z.infer<typeof scannerSchema>

export default function ScannerManagementPage() {
  const [loading, setLoading] = useState(false)
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [loadingScanners, setLoadingScanners] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<ScannerFormValues>({
    resolver: zodResolver(scannerSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      criteria: {
        newsRequired: false,
      },
    },
  })
  
  useEffect(() => {
    fetchScanners();
  }, [])
  
  const fetchScanners = async () => {
    setLoadingScanners(true);
    try {
        const fetchedScanners = await getScanners();
        setScanners(fetchedScanners);
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch scanners."})
    } finally {
        setLoadingScanners(false);
    }
  }

  const handleEdit = (scanner: Scanner) => {
    setIsEditing(scanner.id!);
    form.reset({
        name: scanner.name,
        description: scanner.description,
        isActive: scanner.isActive,
        criteria: scanner.criteria
    });
  }

  const handleCancelEdit = () => {
      setIsEditing(null);
      form.reset({
        name: "",
        description: "",
        isActive: true,
        criteria: { newsRequired: false },
      });
  }

  const onSubmit = async (data: ScannerFormValues) => {
    setLoading(true)
    try {
      if (isEditing) {
        await updateScanner(isEditing, data)
        toast({ title: "Scanner Updated", description: "The scanner has been successfully updated."})
      } else {
        await saveScanner(data)
        toast({ title: "Scanner Saved", description: "The new scanner has been saved."})
      }
      handleCancelEdit();
      fetchScanners(); // Refresh the list
    } catch (error) {
      console.error("Error saving scanner:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the scanner.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Scanner' : 'Create New Scanner'}</CardTitle>
                <CardDescription>
                {isEditing ? 'Modify the details of the existing scanner.' : 'Define a new market scanner for users.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Scanner Name</FormLabel>
                                <FormControl><Input placeholder="e.g., High Volume Movers" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Describe what this scanner looks for..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Scanner Criteria</CardTitle>
                            <CardDescription>Define the parameters for this scanner.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="criteria.minVolume" render={({ field }) => (
                                <FormItem><FormLabel>Min Volume</FormLabel><FormControl><Input type="number" placeholder="e.g., 1000000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="criteria.minRelativeVolume" render={({ field }) => (
                                <FormItem><FormLabel>Min Rel. Volume</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="criteria.minPrice" render={({ field }) => (
                                <FormItem><FormLabel>Min Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 1.00" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="criteria.maxPrice" render={({ field }) => (
                                <FormItem><FormLabel>Max Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="criteria.minMarketCap" render={({ field }) => (
                                <FormItem><FormLabel>Min Market Cap</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="criteria.maxMarketCap" render={({ field }) => (
                                <FormItem><FormLabel>Max Market Cap</FormLabel><FormControl><Input type="number" placeholder="e.g., 2000000000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="criteria.newsRequired" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm sm:col-span-2">
                                <div className="space-y-0.5">
                                    <FormLabel>Must Have Recent News</FormLabel>
                                    <FormMessage />
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                    
                    <FormField control={form.control} name="isActive" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Activate Scanner</FormLabel>
                            <p className="text-sm text-muted-foreground">Make this scanner available for users.</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEditing ? 'Update Scanner' : 'Save Scanner'}
                        </Button>
                        {isEditing && (
                            <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                        )}
                    </div>
                </form>
                </Form>
            </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Existing Scanners</CardTitle>
                    <CardDescription>A list of all currently configured scanners.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingScanners ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : scanners.length > 0 ? (
                        scanners.map(scanner => (
                            <div key={scanner.id} className="flex items-center justify-between rounded-md border p-3">
                                <div className="flex-1">
                                    <p className="font-semibold flex items-center gap-2">
                                        {scanner.name}
                                        <Badge variant={scanner.isActive ? "default" : "secondary"}>
                                            {scanner.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{scanner.description}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                     <Button size="icon" variant="ghost" onClick={() => handleEdit(scanner)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {isEditing === scanner.id && (
                                        <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No scanners created yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
