
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KeyRound, Terminal, CheckCircle, Info } from "lucide-react"

export default function ApiKeysPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            API Key Management
        </CardTitle>
        <CardDescription>
          A guide to securely setting API keys as environment variables in Firebase App Hosting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Security Best Practice</AlertTitle>
            <AlertDescription>
                For security reasons, API keys should never be hard-coded, stored in a database, or checked into source control.
                Using server-side environment variables is the most secure method.
            </AlertDescription>
        </Alert>

        <div className="space-y-4 text-sm">
            <h3 className="text-lg font-semibold">How to Add Environment Variables</h3>
            <p>You can add your API keys to this application by setting them in your Firebase App Hosting backend configuration.</p>
            
            <ol className="list-decimal list-inside space-y-3 pl-4">
                <li>Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a> and select your project.</li>
                <li>In the left-hand navigation menu under the "Build" category, click on <b>App Hosting</b>.</li>
                <li>You will see a table of your App Hosting backends. Find the one for this app (e.g., <b>market-momentum-backend</b>) and click on it.</li>
                <li>On the backend's details page, find the card titled <b>Environment variables</b> and click "Add variable".</li>
                <li>
                    Enter the variable name you want to use in your code (e.g., <code className="bg-muted px-1 py-0.5 rounded">POLYGON_API_KEY</code>). This is the name you'll use in the "API Key Variable" field when you create a News Source.
                </li>
                <li>
                    Paste your secret API key into the "Value" field.
                </li>
                <li>Click "Save". This will trigger a new rollout of your backend with the new environment variable securely stored.</li>
            </ol>
        </div>

        <Alert variant="default" className="border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
                Environment variables in App Hosting are managed entirely on the server. You do not need a <code className="bg-muted px-1 py-0.5 rounded">.env</code> file in your project for these secrets. The application will automatically have access to them once they are set in the Firebase Console.
            </AlertDescription>
        </Alert>

        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Verification</AlertTitle>
            <AlertDescription>
                Once an environment variable is set and the backend has finished its new rollout, the application will automatically use it for the corresponding data source.
                You can verify this by checking the System Logs for successful data ingestion from that source.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
