"use client"

import { cn } from "@/lib/utils"

interface FallbackMathRendererProps {
  math: string
  block?: boolean
  className?: string
  theme?: "light" | "dark"
}

export default function FallbackMathRenderer({
  math,
  block = false,
  className = "",
  theme = "dark",
}: FallbackMathRendererProps) {
  // Process the math content with basic formatting
  const processedMath = (content: string): string => {
    let result = content.trim()

    // Basic formatting for common math symbols
    result = result
      .replace(/\\sin/g, "sin")
      .replace(/\\cos/g, "cos")
      .replace(/\\tan/g, "tan")
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
      .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\theta/g, "θ")
      .replace(/\\pi/g, "π")
      .replace(/\\infty/g, "∞")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\pm/g, "±")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")

    return result
  }

  return (
    <div
      className={cn(
        `fallback-math-renderer ${block ? "math-block" : "math-inline"}`,
        theme === "light" ? "math-light bg-transparent text-black" : "math-dark",
        className,
      )}
      style={theme === "light" ? { backgroundColor: "transparent", color: "#000" } : {}}
      dangerouslySetInnerHTML={{ __html: processedMath(math) }}
    />
  )
}
