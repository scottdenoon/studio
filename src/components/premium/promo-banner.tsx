
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ArrowRight } from "lucide-react"

export default function PromoBanner() {
    return (
        <Card className="bg-gradient-to-r from-primary to-accent border-0 text-primary-foreground shadow-lg">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-300" />
                    <div>
                        <h4 className="font-semibold">Unlock Premium Features</h4>
                        <p className="text-xs text-primary-foreground/80">Get real-time scanners, AI insights, and more.</p>
                    </div>
                </div>
                <Button asChild variant="secondary" size="sm">
                    <Link href="/pricing">
                        Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
