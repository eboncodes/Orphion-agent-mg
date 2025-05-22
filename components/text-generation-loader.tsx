"use client"

import { useEffect, useState } from "react"

interface TextGenerationLoaderProps {
  text?: string
  mode?: "working" | "summarizing" | "analyzing"
}

export default function TextGenerationLoader({
  text = "Orphion is working...",
  mode = "working",
}: TextGenerationLoaderProps) {
  const [dots, setDots] = useState("")

  // Get the appropriate text based on mode
  const displayText =
    mode === "summarizing"
      ? "Orphion is summarizing..."
      : mode === "analyzing"
        ? "Orphion is generating detailed analysis..."
        : text

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 text-neutral-300 animate-fadeIn">
      <div className="loader-small"></div>
      <div className="flex">
        <span className="text-sm">{displayText}</span>
        <span className="w-6 inline-block text-sm">{dots}</span>
      </div>
    </div>
  )
}
