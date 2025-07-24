"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "../ui/badge"

const initialData = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i);
  return {
    date: date.toISOString(),
    price: 150 + Math.random() * 20 - 10 + i * 1.5,
  };
});

const chartConfig = {
  price: {
    label: "Price (USD)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function RealtimeChart() {
  const [data, setData] = React.useState(initialData)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newDataPoint = {
          date: new Date().toISOString(),
          price:
            prevData[prevData.length - 1].price + (Math.random() * 4 - 2),
        }
        const updatedData = [...prevData.slice(1), newDataPoint]
        return updatedData
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [])

  const lastPrice = data[data.length - 1]?.price.toFixed(2);
  const firstPrice = data[0]?.price.toFixed(2);
  const priceChange = (data[data.length - 1]?.price - data[data.length - 2]?.price)?.toFixed(2) || 0;
  const priceChangePercentage = ((priceChange / data[data.length - 2]?.price) * 100)?.toFixed(2) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ACME Inc. (ACME)</CardTitle>
            <CardDescription>Real-time Price Chart</CardDescription>
          </div>
          <div className="text-right">
              <div className="text-3xl font-bold">${lastPrice}</div>
              <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange} ({priceChangePercentage}%)
              </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), "HH:mm:ss")}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                cursor={{
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label, payload) => {
                      return payload[0] ? format(new Date(payload[0].payload.date), 'PPpp') : '';
                    }}
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                }
              />
              <Area
                dataKey="price"
                type="monotone"
                fill="url(#fillPrice)"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
