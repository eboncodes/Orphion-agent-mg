"use client"

import { useEffect, useRef, useState } from "react"

// MathJax CSS and script loader component
const MathJaxLoader = () => {
  useEffect(() => {
    // Check if MathJax is already loaded
    if (window.MathJax) {
      return
    }

    // Configure MathJax
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["$$", "$$"],
        ],
        displayMath: [
          ["$$", "$$"],
          ["\\[", "\\]"],
        ],
        processEscapes: true,
        processEnvironments: true,
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        ignoreHtmlClass: "tex2jax_ignore",
        processHtmlClass: "tex2jax_process",
      },
      svg: {
        fontCache: "global",
      },
    }

    // Load MathJax script
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Cleanup is not really needed as MathJax should remain loaded
    }
  }, [])

  return null
}

interface MathJaxRendererProps {
  math: string
  block?: boolean
  className?: string
  onError?: () => void
}

export default function MathJaxRenderer({ math, block = false, className = "", onError }: MathJaxRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    const renderMath = async () => {
      try {
        if (!containerRef.current) return

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

        // Set the content
        containerRef.current.textContent = content

        // If MathJax is loaded, typeset the content
        if (window.MathJax) {
          try {
            await window.MathJax.typesetPromise([containerRef.current])
            setRendered(true)
          } catch (err) {
            console.error("MathJax typesetting error:", err)
            throw err
          }
        } else {
          // If MathJax is not loaded yet, wait for it
          const checkMathJax = setInterval(() => {
            if (window.MathJax) {
              clearInterval(checkMathJax)
              window.MathJax.typesetPromise([containerRef.current])
                .then(() => setRendered(true))
                .catch((err: any) => {
                  console.error("MathJax typesetting error:", err)
                  setError(err instanceof Error ? err.message : "Failed to render math")
                  if (onError) onError()
                })
            }
          }, 100)

          // Set a timeout to clear the interval if MathJax doesn't load
          setTimeout(() => {
            clearInterval(checkMathJax)
            if (!rendered) {
              setError("MathJax failed to load")
              if (onError) onError()
            }
          }, 5000)
        }
      } catch (err) {
        console.error("MathJax rendering error:", err)
        setError(err instanceof Error ? err.message : "Failed to render math")
        if (onError) onError()
      }
    }

    renderMath()
  }, [math, block, onError, rendered])

  // Fallback rendering when MathJax fails
  if (error && !rendered) {
    return (
      <div className={`fallback-math ${block ? "block" : "inline"} ${className}`}>
        <code>{math}</code>
      </div>
    )
  }

  return (
    <>
      <MathJaxLoader />
      <div
        ref={containerRef}
        className={`mathjax-renderer ${block ? "mathjax-block" : "mathjax-inline"} ${className}`}
      />
    </>
  )
}

// Add this to make TypeScript happy with the window.MathJax property
declare global {
  interface Window {
    MathJax?: any
  }
}
