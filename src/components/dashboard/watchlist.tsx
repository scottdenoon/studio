"use client"

import { MoreHorizontal, Bell, PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const watchlistData = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 172.45,
    change: 2.75,
    changePercent: 1.62,
    volume: "98.7M",
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    price: 185.33,
    change: -4.12,
    changePercent: -2.18,
    volume: "120.1M",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    price: 180.75,
    change: 1.05,
    changePercent: 0.58,
    volume: "55.4M",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 125.21,
    change: 8.99,
    changePercent: 7.73,
    volume: "250.6M",
  },
    {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    price: 177.85,
    change: -0.50,
    changePercent: -0.28,
    volume: "30.2M",
  },
]

export default function Watchlist() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Watchlist</CardTitle>
          <CardDescription>
            Customizable watchlist with real-time quotes.
          </CardDescription>
        </div>
         <Button size="sm" variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead className="hidden sm:table-cell">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlistData.map((stock) => (
              <TableRow key={stock.ticker}>
                <TableCell>
                  <div className="font-medium">{stock.ticker}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {stock.name}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">${stock.price.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <div>{stock.change.toFixed(2)}</div>
                  <div className="text-xs">({stock.changePercent.toFixed(2)}%)</div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DialogTrigger asChild>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Set Alert
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set Alert for {stock.ticker}</DialogTitle>
                          <DialogDescription>
                            Get notified when your price or momentum targets are hit.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price-threshold" className="text-right">
                              Price Above
                            </Label>
                            <Input id="price-threshold" type="number" defaultValue={(stock.price * 1.05).toFixed(2)} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price-threshold-below" className="text-right">
                              Price Below
                            </Label>
                            <Input id="price-threshold-below" type="number" defaultValue={(stock.price * 0.95).toFixed(2)} className="col-span-3" />
                          </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="momentum" className="text-right">
                              Momentum
                            </Label>
                            <Input id="momentum" placeholder="e.g., 5% gain in 10 mins" className="col-span-3" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Alert</Button>
                        </DialogFooter>
                      </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
