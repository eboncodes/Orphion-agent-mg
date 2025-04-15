"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ChartRendererProps {
  chartData: string
  className?: string
}

type ChartType = "line" | "bar" | "pie" | "area"

interface ParsedChartData {
  type: ChartType
  title?: string
  data: any[]
  keys: string[]
  colors?: string[]
}

export default function ChartRenderer({ chartData, className }: ChartRendererProps) {
  const [parsedData, setParsedData] = useState<ParsedChartData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Default chart colors
  const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
  ]

  // Parse the chart data
  useEffect(() => {
    try {
      // Parse the JSON data
      const parsed = JSON.parse(chartData)

      // Validate required fields
      if (!parsed.type || !parsed.data || !Array.isArray(parsed.data)) {
        throw new Error("Invalid chart data format. Missing required fields.")
      }

      // Extract data keys (excluding 'name' which is used for labels)
      const keys = Object.keys(parsed.data[0] || {}).filter((key) => key !== "name")

      // Set the parsed data
      setParsedData({
        type: parsed.type,
        title: parsed.title,
        data: parsed.data,
        keys: keys,
        colors: parsed.colors || defaultColors,
      })

      setError(null)
    } catch (err) {
      console.error("Error parsing chart data:", err)
      setError("Failed to parse chart data. Please check the format.")
      setParsedData(null)
    }
  }, [chartData])

  // If there's an error, display it
  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
        <p className="text-red-400">{error}</p>
        <pre className="mt-2 text-xs text-neutral-400 overflow-auto">{chartData}</pre>
      </div>
    )
  }

  // If data is still parsing or invalid, show loading
  if (!parsedData) {
    return <div className="h-64 flex items-center justify-center bg-neutral-800/50 rounded-lg">Loading chart...</div>
  }

  // Create a config object for the ChartContainer
  const chartConfig: Record<string, { label: string; color: string }> = {}
  parsedData.keys.forEach((key, index) => {
    chartConfig[key] = {
      label: key,
      color:
        parsedData.colors?.[index % (parsedData.colors?.length || 1)] || defaultColors[index % defaultColors.length],
    }
  })

  // Render the appropriate chart based on type
  const renderChart = () => {
    switch (parsedData.type) {
      case "line":
        return (
          <LineChart data={parsedData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {parsedData.keys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        )

      case "bar":
        return (
          <BarChart data={parsedData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {parsedData.keys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={`var(--color-${key})`} />
            ))}
          </BarChart>
        )

      case "pie":
        return (
          <PieChart>
            <Pie
              data={parsedData.data}
              dataKey={parsedData.keys[0]}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {parsedData.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    parsedData.colors?.[index % (parsedData.colors?.length || 1)] ||
                    defaultColors[index % defaultColors.length]
                  }
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        )

      case "area":
        return (
          <AreaChart data={parsedData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {parsedData.keys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        )

      default:
        return <div>Unsupported chart type: {parsedData.type}</div>
    }
  }

  return (
    <div className={className}>
      {parsedData.title && <h3 className="text-lg font-medium mb-4 text-center">{parsedData.title}</h3>}
      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
