
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { CheckCircle, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PricingPage() {
    const { user, userProfile } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

    const handleSubscribe = async () => {
        if (!user) {
            router.push("/login?redirect=/pricing")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    priceId: plans[billingCycle].priceId,
                    userId: user.uid 
                }),
            })

            const { sessionId, error } = await res.json()
            if (error) throw new Error(error)
            if (!sessionId) throw new Error("Could not create checkout session.")

            const stripe = await stripePromise
            if (!stripe) throw new Error("Stripe.js failed to load.")

            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
            if (stripeError) {
                toast({ variant: "destructive", title: "Error", description: stripeError.message })
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message })
        } finally {
            setLoading(false)
        }
    }

    const plans = {
        monthly: {
            price: "$49",
            priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
        },
        yearly: {
            price: "$490",
            priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
        }
    }

    const features = [
        "Real-time News Feed with AI Analysis",
        "Unlimited Watchlists & Alerts",
        "Advanced Market Scanners",
        "AI-Powered Trade Journal Analysis",
        "Priority Support"
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Find Your Edge in the Market
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Unlock powerful, real-time trading tools with a Premium subscription. No hidden fees, cancel anytime.
                </p>
            </div>

            <div className="flex items-center gap-4 my-8">
                <span>Monthly</span>
                <Switch
                    checked={billingCycle === "yearly"}
                    onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                />
                <span className="flex items-center gap-2">
                    Yearly
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">SAVE 20%</span>
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>Basic tools to get you started in the market.</CardDescription>
                        <p className="text-4xl font-bold">$0</p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" /> Limited News Feed
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" /> 1 Watchlist
                            </li>
                             <li className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-500" /> Basic Scanners
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" disabled>
                            Your Current Plan
                        </Button>
                    </CardFooter>
                </Card>

                <Card className={cn("border-2 border-primary flex flex-col shadow-2xl")}>
                     <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Premium</CardTitle>
                            <span className="text-xs font-semibold uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">Recommended</span>
                        </div>
                        <CardDescription>Full access to all our AI-powered trading tools.</CardDescription>
                        <p className="text-4xl font-bold">{plans[billingCycle].price}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span></p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-3 text-sm">
                            {features.map(feature => (
                                <li key={feature} className="flex items-center gap-2 font-medium">
                                    <CheckCircle className="h-4 w-4 text-primary" /> {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {userProfile?.role === 'premium' ? (
                             <Button variant="default" className="w-full" disabled>
                                You are a Premium Member
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Upgrade to Premium"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
