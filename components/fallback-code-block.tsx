"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { getLanguageName } from "@/utils/code-utils"
import { cn } from "@/lib/utils"

interface FallbackCodeBlockProps {
  language?: string
  title?: string
  children: string
  showLineNumbers?: boolean
  className?: string
}

export default function FallbackCodeBlock({
  language = "jsx",
  title,
  children,
  showLineNumbers = false,
  className,
}: FallbackCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  // Add line numbers if requested
  const codeWithLineNumbers = showLineNumbers
    ? children
        .split("\n")
        .map((line, i) => `${i + 1} | ${line}`)
        .join("\n")
    : children

  return (
    <div className={cn("my-4", className)}>
      <div className="code-header">
        <span className="text-xs text-neutral-400">{title || getLanguageName(language)}</span>
        <button
          onClick={handleCopy}
          className={`copy-button ${copied ? "copied" : ""}`}
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`language-${language} bg-[#1e1e1e] p-4 rounded-b-lg overflow-x-auto`}>
        <code>{codeWithLineNumbers}</code>
      </pre>
    </div>
  )
}
