
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getMarketDataConfig, updateMarketDataConfig, MarketDataField } from "@/services/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { StockDataSchema } from "@/lib/types"
import { NewsItem } from "@/services/firestore"
import { z } from "zod"

export default function MarketDataConfigPage() {
  const [config, setConfig] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const marketDataFields: (MarketDataField & { defaultEnabled: boolean })[] = [
      { id: 'price', label: 'Price', description: 'Latest closing price.', defaultEnabled: true },
      { id: 'change', label: 'Change ($)', description: 'Price change from previous day.', defaultEnabled: true },
      { id: 'changePercent', label: 'Change (%)', description: 'Percentage price change.', defaultEnabled: true },
      { id: 'volume', label: 'Volume', description: 'Trading volume for the day.', defaultEnabled: true },
      { id: 'relativeVolume', label: 'Relative Volume', description: 'Volume compared to average.', defaultEnabled: true },
      { id: 'float', label: 'Float', description: 'Shares available for trading.', defaultEnabled: false },
      { id: 'shortInterest', label: 'Short Interest', description: 'Percentage of shares held short.', defaultEnabled: false },
      { id: 'priceAction', label: 'Price Action', description: 'Description of recent price movement.', defaultEnabled: false },
  ];

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true)
      try {
        const savedConfig = await getMarketDataConfig()
        const initialConfig: Record<string, boolean> = {}
        marketDataFields.forEach(field => {
            initialConfig[field.id] = savedConfig[field.id] ?? field.defaultEnabled;
        })
        setConfig(initialConfig)
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch market data configuration.",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [toast])

  const handleToggle = (fieldId: string) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [fieldId]: !prevConfig[fieldId],
    }))
  }
  
  const handleSaveChanges = async () => {
      setIsSaving(true);
      try {
          await updateMarketDataConfig(config);
          toast({
              title: "Configuration Saved",
              description: "Your market data display preferences have been updated."
          })
      } catch(e) {
          toast({
             variant: "destructive",
             title: "Error",
             description: "Could not save your configuration."
          });
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <div>
       <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Market Data Configuration</AlertTitle>
        <AlertDescription>
          Select which real-time market data points you want to display when a user expands a news article. 
          Changes will apply across the entire application.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            News Card Market Data
          </CardTitle>
          <CardDescription>
            Enable or disable fields to show on expanded news cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-11" />
              </div>
            ))
          ) : marketDataFields.length === 0 ? (
             <div className="text-center text-muted-foreground py-12">
                No market data fields have been defined.
            </div>
          ) : (
            marketDataFields.map(field => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold">{field.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {field.description}
                  </p>
                </div>
                <Switch
                  checked={config[field.id] ?? false}
                  onCheckedChange={() => handleToggle(field.id)}
                  aria-label={`Toggle ${field.label}`}
                />
              </div>
            ))
          )}
        </CardContent>
         <CardContent>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
            </Button>
         </CardContent>
      </Card>
    </div>
  )
}
