
"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from 'next-themes';

interface StockChartProps {
    data: { date: string; price: number }[];
}

export function StockChart({ data }: StockChartProps) {
    const { theme } = useTheme();

    if (!data || data.length === 0) {
        return <div className="h-80 flex items-center justify-center text-muted-foreground">No historical data available.</div>;
    }

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 12 }} 
                        tickLine={{ stroke: theme === 'dark' ? '#3f3f46' : '#e4e4e7' }}
                    />
                    <YAxis 
                        domain={['dataMin', 'dataMax']}
                        tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#71717a', fontSize: 12 }} 
                        tickLine={{ stroke: theme === 'dark' ? '#3f3f46' : '#e4e4e7' }}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                            borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                            color: theme === 'dark' ? '#fafafa' : '#09090b'
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Price']}
                    />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
