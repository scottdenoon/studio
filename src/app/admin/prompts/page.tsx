"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getPrompts, savePrompt } from "@/services/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function PromptManagementPage() {
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [selectedPrompt, setSelectedPrompt] = useState<string>("")
  const [promptContent, setPromptContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const fetchedPrompts = await getPrompts()
        setPrompts(fetchedPrompts)
        if (Object.keys(fetchedPrompts).length > 0) {
          const firstPromptKey = Object.keys(fetchedPrompts)[0]
          setSelectedPrompt(firstPromptKey)
          setPromptContent(fetchedPrompts[firstPromptKey])
        }
      } catch (error) {
        console.error("Error fetching prompts:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load prompts from the database.",
        })
      } finally {
        setLoadingPrompts(false)
      }
    }
    fetchPrompts()
  }, [toast])

  const handlePromptChange = (promptKey: string) => {
    setSelectedPrompt(promptKey)
    setPromptContent(prompts[promptKey])
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await savePrompt(selectedPrompt, promptContent)
      setPrompts(prev => ({...prev, [selectedPrompt]: promptContent}))
      toast({
        title: "Prompt Saved",
        description: `The prompt "${selectedPrompt}" has been updated successfully.`,
      })
    } catch (error) {
      console.error("Error saving prompt:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the prompt.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prompt Management</CardTitle>
        <CardDescription>
          Select a prompt to view, edit, and save changes. Be careful when editing prompts as it can affect the AI's output.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingPrompts ? (
          <div className="space-y-6">
              <Skeleton className="h-10 w-full md:w-[350px]" />
              <Skeleton className="h-[280px] w-full" />
              <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="prompt-select" className="text-sm font-medium">Select Prompt</label>
              <Select value={selectedPrompt} onValueChange={handlePromptChange} disabled={Object.keys(prompts).length === 0}>
                <SelectTrigger id="prompt-select" className="w-full md:w-[350px]">
                  <SelectValue placeholder="Select a prompt" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(prompts).map(key => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="prompt-content" className="text-sm font-medium">Prompt Content</label>
              <Textarea
                id="prompt-content"
                value={promptContent}
                onChange={e => setPromptContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                disabled={!selectedPrompt}
              />
            </div>
            <Button onClick={handleSave} disabled={loading || !selectedPrompt}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
