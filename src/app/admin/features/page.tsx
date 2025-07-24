
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
import { getFeatureFlags, updateFeatureFlag, FeatureFlag } from "@/services/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function FeatureManagementPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    setLoading(true)
    try {
      const flags = await getFeatureFlags()
      setFeatureFlags(flags)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch feature flags.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const updatedEnabled = !flag.enabled
      await updateFeatureFlag(flag.id, updatedEnabled)
      
      // Optimistically update the UI
      setFeatureFlags(prevFlags =>
        prevFlags.map(f => (f.id === flag.id ? { ...f, enabled: updatedEnabled } : f))
      )
      
      toast({
        title: `Feature ${updatedEnabled ? "Enabled" : "Disabled"}`,
        description: `${flag.name} has been turned ${updatedEnabled ? "on" : "off"}.`,
      })
    } catch (error) {
      console.error("Error toggling feature flag:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the feature flag.",
      })
      // Revert UI change on error
      fetchFlags()
    }
  }

  return (
    <div>
       <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Dynamic Feature Control</AlertTitle>
        <AlertDescription>
          This interface allows you to toggle application features in real-time. Changes here will affect all users. 
          The application code must be written to check these flags before rendering a feature.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Feature Management</CardTitle>
          <CardDescription>
            Enable or disable features across the application for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-11" />
              </div>
            ))
          ) : featureFlags.length === 0 ? (
             <div className="text-center text-muted-foreground py-12">
                No feature flags have been defined in the database.
            </div>
          ) : (
            featureFlags.map(flag => (
              <div
                key={flag.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold">{flag.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {flag.description}
                  </p>
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => handleToggle(flag)}
                  aria-label={`Toggle ${flag.name}`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
