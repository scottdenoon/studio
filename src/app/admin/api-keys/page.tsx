
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KeyRound, Terminal, CheckCircle } from "lucide-react"

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
                For security reasons, API keys should never be hard-coded or stored in the database.
                Using environment variables ensures they are not exposed in your source code or client-side application.
            </AlertDescription>
        </Alert>

        <div className="space-y-4 text-sm">
            <h3 className="text-lg font-semibold">How to Add Environment Variables</h3>
            <p>You can add your API keys to this application by setting them in your Firebase App Hosting backend configuration.</p>
            
            <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to your project's Firebase Console.</li>
                <li>Navigate to the <b>App Hosting</b> section.</li>
                <li>Select your backend (e.g., <b>market-momentum-backend</b>).</li>
                <li>In the <b>Environment variables</b> section, click "Add variable".</li>
                <li>
                    Enter the variable name you specified in the News Source settings (e.g., <code className="bg-muted px-1 py-0.5 rounded">POLYGON_API_KEY</code>).
                </li>
                <li>
                    Paste your API key into the "Value" field.
                </li>
                <li>Click "Save" and redeploy your backend for the changes to take effect.</li>
            </ol>
        </div>

        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Verification</AlertTitle>
            <AlertDescription>
                Once an environment variable is set and the backend is redeployed, the application will automatically use it for the corresponding data source.
                You can verify this by checking the System Logs for successful data ingestion from that source.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
