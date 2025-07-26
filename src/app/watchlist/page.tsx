
"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  WatchlistItem
} from '@/services/firestore';
import { getWatchlistAction, addWatchlistItem, removeWatchlistItem, addAlert } from '@/app/actions';

import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Star, PlusCircle, MoreHorizontal, Trash, Loader2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogClose } from '@radix-ui/react-dialog';
import AiBriefing from '@/components/dashboard/market-summary';
import { Badge } from '@/components/ui/badge';

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

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isBriefingOpen, setBriefingOpen] = useState(false);

  const form = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: { ticker: "" },
  });

  const alertForm = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
  })

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const watchlistData = await getWatchlistAction(user.uid);
      setWatchlist(watchlistData);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your watchlist." });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchWatchlist();
    }
  }, [user, authLoading, router, fetchWatchlist]);
  
  const onAddSubmit = async (data: WatchlistFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (watchlist.some(item => item.ticker === data.ticker)) {
           toast({
              variant: "destructive",
              title: "Stock Exists",
              description: `${data.ticker} is already in your watchlist.`,
          });
          setIsSubmitting(false);
          return;
      }
      await addWatchlistItem({ ticker: data.ticker, userId: user.uid });
      await fetchWatchlist();
      
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
        setIsSubmitting(false);
    }
  }

  const handleRemove = async (id: string, ticker: string) => {
      try {
          await removeWatchlistItem(id);
          await fetchWatchlist();
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

  const onAlertSubmit = async (ticker: string, data: AlertFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
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
        setIsSubmitting(false);
    }
}

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Watchlist</h1>
              <p className="text-muted-foreground">Keep track of stocks you're interested in.</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add to Watchlist</DialogTitle>
                        <DialogDescription>Enter a stock ticker to add it to your watchlist.</DialogDescription>
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
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Stock
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Change</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : watchlist.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Star className="h-8 w-8" />
                                        <p className="font-medium">Your watchlist is empty.</p>
                                        <p className="text-sm">Click "Add Stock" to start building your watchlist.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            watchlist.map(stock => (
                                <TableRow key={stock.id}>
                                    <TableCell><Badge variant="outline">{stock.ticker}</Badge></TableCell>
                                    <TableCell className="font-medium">{stock.name}</TableCell>
                                    <TableCell>${stock.price.toFixed(2)}</TableCell>
                                    <TableCell className={cn(stock.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                    </TableCell>
                                    <TableCell>{stock.volume.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
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
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(stock.id, stock.ticker)}>
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
                                                            <DialogClose asChild>
                                                                <Button type="submit" disabled={isSubmitting}>
                                                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                    Save Alert
                                                                </Button>
                                                            </DialogClose>
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
        </main>
      </div>

       <Dialog open={isBriefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent>
          <AiBriefing open={isBriefingOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
