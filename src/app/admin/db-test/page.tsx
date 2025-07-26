
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { addTestDocument } from "@/app/actions"

export default function DatabaseTestPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleTestWrite = async () => {
    setLoading(true)
    try {
      const docId = await addTestDocument();
      toast({
        title: "Database Write Successful",
        description: `A test document was successfully created with ID: ${docId}`,
      })
    } catch (error: any) {
      console.error("Database write failed:", error)
      toast({
        variant: "destructive",
        title: "Database Write Failed",
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
        <CardDescription>
          Click the button below to perform a test write operation to your Firestore database.
          This will create a document in a 'test_writes' collection to verify that the connection
          and permissions are configured correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 pt-8">
        <p className="text-sm text-muted-foreground">
          You can verify the result in your Firebase Console.
        </p>
        <Button onClick={handleTestWrite} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Run Write Test"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
