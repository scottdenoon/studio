
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getWatchlist, addWatchlistItem, removeWatchlistItem, WatchlistItem } from "@/services/firestore"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "../ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { useAuth } from "@/hooks/use-auth"

const watchlistSchema = z.object({
    ticker: z.string().min(1, "Ticker is required").max(5, "Ticker is too long"),
    name: z.string().min(1, "Name is required"),
    price: z.coerce.number().positive("Price must be positive"),
    change: z.coerce.number(),
    changePercent: z.coerce.number(),
    volume: z.string().min(1, "Volume is required"),
})

type WatchlistFormValues = z.infer<typeof watchlistSchema>

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
            name: "",
            price: 0,
            change: 0,
            changePercent: 0,
            volume: ""
        },
    });

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
    
    const onSubmit = async (data: WatchlistFormValues) => {
        if (!user) return;
        setSubmitting(true);
        try {
            const newWatchlistItem = { ...data, userId: user.uid };
            const id = await addWatchlistItem(newWatchlistItem);
            setWatchlist(prev => [...prev, { ...newWatchlistItem, id}]);
            toast({
                title: "Stock Added",
                description: `${data.ticker} has been added to your watchlist.`,
            });
            setAddDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error adding watchlist item:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add the stock to your watchlist.",
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
                        Enter the details for the new stock.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="ticker" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ticker</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="price" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="volume" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Volume</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
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
                            <DropdownMenuItem>
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
                            <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price-threshold" className="text-right">
                                Price Above
                                </Label>
                                <Input id="price-threshold" type="number" defaultValue={(stock.price * 1.05).toFixed(2)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price-threshold-below" className="text-right">
                                Price Below
                                </Label>
                                <Input id="price-threshold-below" type="number" defaultValue={(stock.price * 0.95).toFixed(2)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="momentum" className="text-right">
                                Momentum
                                </Label>
                                <Input id="momentum" placeholder="e.g., 5% gain in 10 mins" className="col-span-3" />
                            </div>
                            </div>
                            <DialogFooter>
                            <Button type="submit">Save Alert</Button>
                            </DialogFooter>
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
