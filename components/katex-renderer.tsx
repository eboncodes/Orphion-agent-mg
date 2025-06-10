"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import katex from "katex"
import "katex/dist/katex.min.css"

// KaTeX CSS component
const KatexCSS = () => {
  useEffect(() => {
    // Add KaTeX CSS via CDN
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
    link.integrity = "sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
    link.crossOrigin = "anonymous"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return null
}

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
      // Clean up the math content by removing any existing delimiters
      let content = math.trim()
      content = content.replace(/^\$\$|\$\$$/g, "") // Remove $$ delimiters
      content = content.replace(/^\\\[|\\\]$/g, "") // Remove \[ \] delimiters
      content = content.replace(/^\$|\$$/g, "") // Remove $ delimiters
      content = content.replace(/^\\\(|\\\)$/g, "") // Remove \( \) delimiters

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
    <>
      <KatexCSS />
      <div
        ref={containerRef}
        className={cn(
          `katex-renderer ${block ? "katex-block" : "katex-inline"}`,
          theme === "light" ? "katex-light" : "katex-dark",
          className,
        )}
      />
    </>
  )
}

// Add this to make TypeScript happy with the window.katex property
declare global {
  interface Window {
    katex?: any
  }
}
