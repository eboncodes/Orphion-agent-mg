"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import katex from "katex"
import "katex/dist/katex.min.css"

interface KaTeXRendererProps {
  math: string
  block?: boolean
  className?: string
  onError?: () => void
  theme?: "light" | "dark"
}

export default function KaTeXRenderer({
  math,
  block = false,
  className = "",
  onError,
  theme = "dark",
}: KaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      // Prepare the content based on display mode
      let content = math
      if (block) {
        // For block mode, wrap in display math delimiters if not already wrapped
        if (!content.startsWith("$$") && !content.startsWith("\\[")) {
          content = `$$${content}$$`
        }
      } else {
        // For inline mode, wrap in inline math delimiters if not already wrapped
        if (!content.startsWith("$") && !content.startsWith("\\(")) {
          content = `$${content}$`
        }
      }

      // Render the math using KaTeX
      const renderedMath = katex.renderToString(content, {
        displayMode: block,
        throwOnError: false,
        output: "html",
        strict: false,
        trust: true,
        macros: {
          "\\eqref": "\\href{#1}{}", // Support for equation references
        },
      })

      // Set the rendered content
      containerRef.current.innerHTML = renderedMath

      // Apply theme-specific styling
      if (theme === "light" && containerRef.current) {
        const mathElements = containerRef.current.querySelectorAll(".katex")
        mathElements.forEach((element) => {
          element.classList.add("katex-light")
        })
      }
    } catch (err) {
      console.error("KaTeX rendering error:", err)
      setError(err instanceof Error ? err.message : "Failed to render math")
      if (onError) onError()
    }
  }, [math, block, onError, theme])

  // Fallback rendering when KaTeX fails
  if (error) {
    return (
      <div className={`fallback-math ${block ? "block" : "inline"} ${className}`}>
        <code>{math}</code>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        `katex-renderer ${block ? "katex-block" : "katex-inline"}`,
        theme === "light" ? "katex-light" : "katex-dark",
        className,
      )}
    />
  )
}
