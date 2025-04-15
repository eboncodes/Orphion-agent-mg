"use client"

import { useEffect, useRef, useState } from "react"

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

interface KatexRendererProps {
  math: string
  block?: boolean
  className?: string
  onError?: () => void
}

export default function KatexRenderer({ math, block = false, className = "", onError }: KatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    const renderMath = async () => {
      try {
        // Try to load KaTeX from CDN
        if (!window.katex) {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
          script.integrity = "sha384-XsPbUKEXzZvNnWFLWtYrKmqrFHKZmZiVQjkdEqpLZSRB6WnQ+BuCVR5QpOJ4XJLolR"
          script.crossOrigin = "anonymous"
          script.async = true

          // Create a promise to wait for script to load
          const scriptLoaded = new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })

          document.head.appendChild(script)

          try {
            await scriptLoaded
          } catch (err) {
            throw new Error("Failed to load KaTeX script")
          }
        }

        // Wait for window.katex to be available
        if (window.katex && containerRef.current) {
          window.katex.render(math, containerRef.current, {
            displayMode: block,
            throwOnError: false,
            trust: true,
            strict: false,
          })
          setRendered(true)
        } else {
          throw new Error("KaTeX not available")
        }
      } catch (err) {
        console.error("KaTeX rendering error:", err)
        setError(err instanceof Error ? err.message : "Failed to render math")

        // Call onError callback if provided
        if (onError) onError()

        // Fallback to simple rendering
        if (containerRef.current) {
          containerRef.current.textContent = math
        }
      }
    }

    renderMath()
  }, [math, block, onError])

  // Fallback rendering when KaTeX fails
  if (error && !rendered) {
    return (
      <div className={`fallback-math ${block ? "block" : "inline"} ${className}`}>
        <code>{math}</code>
      </div>
    )
  }

  return (
    <>
      <KatexCSS />
      <div ref={containerRef} className={`katex-renderer ${block ? "katex-block" : "katex-inline"} ${className}`} />
    </>
  )
}

// Add this to make TypeScript happy with the window.katex property
declare global {
  interface Window {
    katex?: any
  }
}
