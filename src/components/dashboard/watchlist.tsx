
"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Bell, PlusCircle, Trash, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getWatchlist, addWatchlistItem, removeWatchlistItem, WatchlistItem, addAlert } from "@/services/firestore"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "../ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { useAuth } from "@/hooks/use-auth"

const watchlistSchema = z.object({
    ticker: z.string().min(1, "Ticker is required").max(5, "Ticker is too long").transform(value => value.toUpperCase()),
})

const alertSchema = z.object({
    priceAbove: z.coerce.number().optional(),
    priceBelow: z.coerce.number().optional(),
    momentum: z.string().optional(),
}).refine(data => data.priceAbove || data.priceBelow || data.momentum, {
    message: "At least one alert condition is required.",
    path: ["priceAbove"],
});


type WatchlistFormValues = z.infer<typeof watchlistSchema>
type AlertFormValues = z.infer<typeof alertSchema>

export default function Watchlist() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isSubmitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<WatchlistFormValues>({
        resolver: zodResolver(watchlistSchema),
        defaultValues: {
            ticker: "",
        },
    });

    const alertForm = useForm<AlertFormValues>({
        resolver: zodResolver(alertSchema),
    })

    useEffect(() => {
        if (!user) {
            setWatchlist([]);
            setLoading(false);
            return;
        };

        const fetchWatchlist = async () => {
            setLoading(true);
            try {
                const items = await getWatchlist(user.uid);
                setWatchlist(items);
            } catch (error) {
                console.error("Error fetching watchlist:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load your watchlist.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, [toast, user]);

    const handleRemove = async (id: string, ticker: string) => {
        try {
            await removeWatchlistItem(id);
            setWatchlist(prev => prev.filter(item => item.id !== id));
            toast({
                title: "Stock Removed",
                description: `${ticker} has been removed from your watchlist.`,
            });
        } catch (error) {
            console.error("Error removing watchlist item:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not remove the stock from your watchlist.",
            });
        }
    };
    
    const onAddSubmit = async (data: WatchlistFormValues) => {
        if (!user) return;
        setSubmitting(true);
        try {
            const newWatchlistItem = await addWatchlistItem({ ticker: data.ticker, userId: user.uid });
            setWatchlist(prev => [...prev, newWatchlistItem]);
            toast({
                title: "Stock Added",
                description: `${data.ticker} has been added to your watchlist.`,
            });
            setAddDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error adding watchlist item:", error);
            const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Error Adding Stock",
                description: errorMessage,
            });
        } finally {
            setSubmitting(false);
        }
    }
    
    const onAlertSubmit = async (ticker: string, data: AlertFormValues) => {
        if (!user) return;
        setSubmitting(true);
        try {
            await addAlert({ ...data, userId: user.uid, ticker });
            toast({
                title: "Alert Set",
                description: `Your alert for ${ticker} has been saved.`,
            });
            alertForm.reset();
        } catch (error) {
             console.error("Error setting alert:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save the alert.",
            });
        } finally {
            setSubmitting(false);
        }
    }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Watchlist</CardTitle>
          <CardDescription>
            Your personal stock watchlist with real-time data.
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add to Watchlist</DialogTitle>
                    <DialogDescription>
                        Enter a stock ticker to add it to your watchlist.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
                        <FormField control={form.control} name="ticker" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ticker</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g., AAPL" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Stock
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead className="hidden sm:table-cell">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                ))
            ) : watchlist.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        Your watchlist is empty. Add a stock to get started.
                    </TableCell>
                </TableRow>
            ) : (
                watchlist.map((stock) => (
                <TableRow key={stock.id}>
                    <TableCell>
                    <div className="font-medium">{stock.ticker}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                        {stock.name}
                    </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">${stock.price.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <div>{stock.change.toFixed(2)}</div>
                    <div className="text-xs">({stock.changePercent.toFixed(2)}%)</div>
                    </TableCell>
                    <TableCell>
                    <Dialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={() => alertForm.reset({priceAbove: Number((stock.price * 1.05).toFixed(2)), priceBelow: Number((stock.price * 0.95).toFixed(2)) })}>
                                <Bell className="mr-2 h-4 w-4" />
                                Set Alert
                            </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleRemove(stock.id, stock.ticker)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Set Alert for {stock.ticker}</DialogTitle>
                            <DialogDescription>
                                Get notified when your price or momentum targets are hit.
                            </DialogDescription>
                            </DialogHeader>
                             <Form {...alertForm}>
                                <form onSubmit={alertForm.handleSubmit((data) => onAlertSubmit(stock.ticker, data))} className="space-y-4">
                                    <FormField control={alertForm.control} name="priceAbove" render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4">
                                            <FormLabel className="text-right">Price Above</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="col-span-3" {...field} /></FormControl>
                                            <FormMessage className="col-start-2 col-span-3" />
                                        </FormItem>
                                    )} />
                                     <FormField control={alertForm.control} name="priceBelow" render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4">
                                            <FormLabel className="text-right">Price Below</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="col-span-3" {...field} /></FormControl>
                                            <FormMessage className="col-start-2 col-span-3"/>
                                        </FormItem>
                                    )} />
                                     <FormField control={alertForm.control} name="momentum" render={({ field }) => (
                                        <FormItem className="grid grid-cols-4 items-center gap-4">
                                            <FormLabel className="text-right">Momentum</FormLabel>
                                            <FormControl><Input placeholder="e.g., 5% gain in 10 mins" className="col-span-3" {...field} /></FormControl>
                                            <FormMessage className="col-start-2 col-span-3"/>
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Alert
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
