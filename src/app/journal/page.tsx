
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import {
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  TradeJournalEntry,
  TradeJournalEntryCreate
} from '@/services/firestore';
import { getJournalEntriesAction } from '@/app/actions';
import { summarizeJournalTrades } from '@/ai/flows/summarize-journal-trades';


import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookText, PlusCircle, Calendar as CalendarIcon, MoreVertical, Edit, Trash2, Image as ImageIcon, X, Bot, TrendingUp, TrendingDown, Percent, Sigma, Trophy, AlertTriangle, Loader2, Star, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import AiBriefing from '@/components/dashboard/market-summary';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PromoBanner from '@/components/premium/promo-banner';

const journalEntrySchema = z.object({
  ticker: z.string().min(1, "Ticker is required").toUpperCase(),
  entryDate: z.date({ required_error: "Entry date is required." }),
  exitDate: z.date({ required_error: "Exit date is required." }),
  entryPrice: z.coerce.number().positive("Entry price must be positive."),
  exitPrice: z.coerce.number().positive("Exit price must be positive."),
  quantity: z.coerce.number().positive("Quantity must be a positive number."),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

type JournalFormValues = z.infer<typeof journalEntrySchema>;

export default function JournalPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TradeJournalEntry | null>(null);
  const [isBriefingOpen, setBriefingOpen] = useState(false);
  const [isSummaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');


  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalEntrySchema),
  });
  
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const entryData = await getJournalEntriesAction(user.uid);
      setEntries(entryData);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your trade journal." });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchEntries();
    }
  }, [user, authLoading, router, fetchEntries]);

  const handleOpenDialog = (entry: TradeJournalEntry | null = null) => {
    setEditingEntry(entry);
    if (entry) {
      form.reset({
        ...entry,
        entryDate: new Date(entry.entryDate),
        exitDate: new Date(entry.exitDate),
      });
    } else {
      form.reset({
        ticker: "",
        entryDate: new Date(),
        exitDate: new Date(),
        entryPrice: undefined,
        exitPrice: undefined,
        quantity: undefined,
        notes: "",
        imageUrl: "",
      });
    }
    setDialogOpen(true);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (data: JournalFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const entryData: TradeJournalEntryCreate = {
      ...data,
      userId: user.uid,
      entryDate: data.entryDate.toISOString(),
      exitDate: data.exitDate.toISOString(),
    };

    try {
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id!, entryData);
        toast({ title: "Trade Updated", description: `Your trade for ${data.ticker} has been updated.` });
      } else {
        await addJournalEntry(entryData);
        toast({ title: "Trade Added", description: `Your trade for ${data.ticker} has been added to your journal.` });
      }
      setDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error("Error submitting journal entry:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save your trade entry." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      toast({ title: "Trade Deleted", description: "The trade entry has been removed from your journal." });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete the trade entry." });
    }
  };

  const isPremiumUser = userProfile?.role === 'premium';

  const handleGetSummary = async () => {
    if (!isPremiumUser) {
        toast({
            variant: "destructive",
            title: "Premium Feature",
            description: "AI Trade Summary is a premium feature. Please upgrade to use it."
        });
        return;
    }
    setSummaryOpen(true);
    setLoadingSummary(true);
    setSummary('');
    try {
        const result = await summarizeJournalTrades({ trades: entries });
        setSummary(result.summary);
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "Could not generate AI summary."});
    } finally {
        setLoadingSummary(false);
    }
  }
  
  const calculateProfitLoss = (entry: TradeJournalEntry) => {
    const pnl = (entry.exitPrice - entry.entryPrice) * entry.quantity;
    const percentage = ((entry.exitPrice - entry.entryPrice) / entry.entryPrice) * 100;
    return { pnl, percentage };
  };

  const journalMetrics = useMemo(() => {
    const trades = entries.map(calculateProfitLoss);
    const totalTrades = entries.length;
    if (totalTrades === 0) {
      return { totalPnl: 0, winRate: 0, avgGain: 0, avgLoss: 0, totalTrades: 0 };
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = (winningTrades.length / totalTrades) * 100;
    const totalGain = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = losingTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgGain = winningTrades.length > 0 ? totalGain / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    return { totalPnl, winRate, avgGain, avgLoss, totalTrades };
  }, [entries]);

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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trade Journal</h1>
              <p className="text-muted-foreground">Log and review your trading activity to improve performance.</p>
            </div>
             <div className="flex items-center gap-2">
                <ToggleGroup type="single" value={view} onValueChange={(value) => { if (value) setView(value as 'grid' | 'list')}} defaultValue="grid" size="sm">
                  <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid /></ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view"><List /></ToggleGroupItem>
                </ToggleGroup>
                <Button onClick={handleGetSummary} variant="outline" disabled={entries.length === 0}>
                    <Star className="mr-2 h-4 w-4 text-yellow-500" /> AI Summary
                </Button>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Trade
                </Button>
            </div>
          </div>
          
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${journalMetrics.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {journalMetrics.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{journalMetrics.winRate.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Gain / Loss</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold flex items-center gap-2">
                            <span className="text-green-600">{journalMetrics.avgGain.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            <span className="text-red-600">{Math.abs(journalMetrics.avgLoss).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{journalMetrics.totalTrades}</div>
                    </CardContent>
                </Card>
           </div>
           
           {!isPremiumUser && <div className="mb-6"><PromoBanner /></div>}

          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : entries.length === 0 ? (
            <Alert>
              <BookText className="h-4 w-4" />
              <AlertTitle>Your Journal is Empty</AlertTitle>
              <AlertDescription>
                Click "Add New Trade" to log your first trade and start tracking your performance.
              </AlertDescription>
            </Alert>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {entries.map(entry => {
                 const { pnl, percentage } = calculateProfitLoss(entry);
                 const isProfit = pnl >= 0;

                 return (
                    <Card key={entry.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{entry.ticker}</CardTitle>
                            <CardDescription>{format(new Date(entry.entryDate), "PPP")}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleOpenDialog(entry)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this trade entry.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                        <div className={`text-center p-3 rounded-md ${isProfit ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                            <p className="text-2xl font-bold">{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                            <p className="text-sm font-medium">({percentage.toFixed(2)}%)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><p className="text-muted-foreground">Entry</p><p className="font-medium">${entry.entryPrice.toFixed(2)}</p></div>
                            <div><p className="text-muted-foreground">Exit</p><p className="font-medium">${entry.exitPrice.toFixed(2)}</p></div>
                            <div><p className="text-muted-foreground">Quantity</p><p className="font-medium">{entry.quantity}</p></div>
                            <div><p className="text-muted-foreground">Exit Date</p><p className="font-medium">{format(new Date(entry.exitDate), "PP")}</p></div>
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground border-t pt-2 italic">"{entry.notes}"</p>}
                      </CardContent>
                      {entry.imageUrl && (
                        <CardFooter>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" size="sm"><ImageIcon className="mr-2 h-4 w-4" />View Chart</Button></PopoverTrigger>
                                <PopoverContent className="w-80"><Image src={entry.imageUrl} alt={`Chart for ${entry.ticker} trade`} width={320} height={240} className="rounded-md" data-ai-hint="stock chart" /></PopoverContent>
                            </Popover>
                        </CardFooter>
                      )}
                    </Card>
                 )
              })}
            </div>
          ) : (
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticker</TableHead>
                                <TableHead>P&L</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Entry/Exit Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {entries.map(entry => {
                            const { pnl, percentage } = calculateProfitLoss(entry);
                            const isProfit = pnl >= 0;
                            return (
                                <TableRow key={entry.id}>
                                    <TableCell><Badge variant="outline">{entry.ticker}</Badge></TableCell>
                                    <TableCell className={cn('font-medium', isProfit ? 'text-green-600' : 'text-red-600')}>
                                        <div className='flex flex-col'>
                                            <span>{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                            <span className='text-xs opacity-80'>({percentage.toFixed(2)}%)</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col text-xs'>
                                            <span>In: {format(new Date(entry.entryDate), "PP")}</span>
                                            <span>Out: {format(new Date(entry.exitDate), "PP")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col text-xs'>
                                            <span>${entry.entryPrice.toFixed(2)}</span>
                                            <span>${entry.exitPrice.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{entry.quantity}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleOpenDialog(entry)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this trade entry.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit' : 'Add'} Trade</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the details of your trade.' : 'Log a new trade to your journal.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="ticker" render={({ field }) => (
                  <FormItem><FormLabel>Ticker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="entryDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Entry Date</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent></Popover><FormMessage /></FormItem>
                 )} />
                 <FormField control={form.control} name="exitDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Exit Date</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent></Popover><FormMessage /></FormItem>
                 )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="entryPrice" render={({ field }) => (
                  <FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="exitPrice" render={({ field }) => (
                  <FormItem><FormLabel>Exit Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Why did you take this trade?" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                 <FormItem>
                    <FormLabel>Chart Image</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormControl>
                            <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </FormControl>
                         <label htmlFor="picture" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild><span className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" />Upload Image</span></Button>
                         </label>
                        {field.value && (
                          <div className="relative h-16 w-16">
                            <Image src={field.value} alt="Chart preview" layout="fill" objectFit="cover" className="rounded-md" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => form.setValue('imageUrl', '')}><X className="h-4 w-4" /></Button>
                          </div>
                        )}
                    </div>
                     <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Trade"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={isBriefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent>
          <AiBriefing open={isBriefingOpen} />
        </DialogContent>
      </Dialog>
       <Dialog open={isSummaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Bot className="h-6 w-6" /> AI Trade Summary</DialogTitle>
                <DialogDescription>
                    An AI-powered analysis of your recent trading performance.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-2 min-h-[12rem] flex flex-col justify-center">
            {loadingSummary ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin"/>
                    <span>Analyzing your trades...</span>
                </div>
            ) : (
                <div className="space-y-2 text-sm text-foreground/90 whitespace-pre-wrap">
                    {summary}
                </div>
            )}
            </div>
        </DialogContent>
       </Dialog>
    </div>
  );
}
