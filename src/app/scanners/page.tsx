
"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getScanners, Scanner, getNewsFeed, NewsItem } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import ScannerCard from '@/components/scanners/scanner-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AiBriefing from '@/components/dashboard/market-summary';

export default function ScannersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBriefingOpen, setBriefingOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [scannerData, newsData] = await Promise.all([
            getScanners(),
            getNewsFeed(),
          ]);
          setScanners(scannerData.filter(s => s.isActive));
          setNewsItems(newsData);
        } catch (error) {
          console.error("Error fetching scanner data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load scanner data.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);
  
  if (authLoading || loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Sidebar onBriefingClick={() => setBriefingOpen(true)} />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                           <Skeleton key={i} className="h-96 w-full" />
                        ))}
                    </div>
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
            <div className='mb-6'>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Market Scanners</h1>
                <p className="text-muted-foreground">Real-time scans based on custom criteria to find market movers.</p>
            </div>
            
            {scanners.length === 0 ? (
                <Alert>
                    <SlidersHorizontal className="h-4 w-4" />
                    <AlertTitle>No Active Scanners</AlertTitle>
                    <AlertDescription>
                        There are currently no active scanners. An administrator can create and activate them in the Admin Console.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {scanners.map(scanner => (
                        <ScannerCard key={scanner.id} scanner={scanner} allNews={newsItems} />
                    ))}
                </div>
            )}
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
