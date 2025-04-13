"use client"

import { useState } from "react"

import React from "react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

// Dynamically import Monaco code block with no SSR
const MonacoCodeBlock = dynamic(() => import("./monaco-code-block"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg h-[300px] flex items-center justify-center">
      <div className="loader-small"></div>
    </div>
  ),
})

// Simple fallback code block for when Monaco fails to load
function FallbackCodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <pre className={`language-${language} bg-[#1e1e1e] p-4 rounded-lg overflow-x-auto font-mono`}>
      <code>{children}</code>
    </pre>
  )
}

interface FormattedTextProps {
  text: string
  className?: string
}

export default function FormattedText({ text, className }: FormattedTextProps) {
  const [monacoFailed, setMonacoFailed] = useState(false)

  // Process the text to apply formatting
  const formattedText = React.useMemo(() => {
    if (!text) return []

    // Split the text into lines to handle headers and lists properly
    const lines = text.split("\n")
    const result: React.ReactNode[] = []

    let inCodeBlock = false
    let codeBlockLanguage = ""
    let codeBlockContent = ""
    let codeBlockIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle code blocks
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true
          const langMatch = line.match(/^```(\w+)?/)
          codeBlockLanguage = langMatch && langMatch[1] ? langMatch[1] : "jsx"
          codeBlockContent = ""
        } else {
          // End of code block
          inCodeBlock = false

          // Use Monaco by default, fallback only if it fails
          if (!monacoFailed) {
            try {
              result.push(
                <MonacoCodeBlock key={`code-${codeBlockIndex++}`} language={codeBlockLanguage}>
                  {codeBlockContent}
                </MonacoCodeBlock>,
              )
            } catch (error) {
              console.error("Monaco editor failed to load:", error)
              setMonacoFailed(true)
              result.push(
                <FallbackCodeBlock key={`code-${codeBlockIndex++}`} language={codeBlockLanguage}>
                  {codeBlockContent}
                </FallbackCodeBlock>,
              )
            }
          } else {
            result.push(
              <FallbackCodeBlock key={`code-${codeBlockIndex++}`} language={codeBlockLanguage}>
                {codeBlockContent}
              </FallbackCodeBlock>,
            )
          }

          // Add explanatory text that might follow the code block
          const explanatoryText: string[] = []
          let j = i + 1
          while (j < lines.length && !lines[j].startsWith("```") && !lines[j].match(/^#+\s/)) {
            explanatoryText.push(lines[j])
            j++
          }

          if (explanatoryText.length > 0) {
            result.push(
              <div key={`explanation-${codeBlockIndex}`} className="mt-2 mb-4 text-neutral-300">
                {explanatoryText.map((line, idx) => (
                  <React.Fragment key={idx}>
                    {processInlineFormatting(line)}
                    {idx < explanatoryText.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>,
            )
            i = j - 1 // Skip the explanatory text lines
          }
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n"
        continue
      }

      // Process headers (###)
      if (line.startsWith("# ")) {
        result.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold my-3">
            {processInlineFormatting(line.substring(2))}
          </h1>,
        )
      } else if (line.startsWith("## ")) {
        result.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold my-2">
            {processInlineFormatting(line.substring(3))}
          </h2>,
        )
      } else if (line.startsWith("### ")) {
        result.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold my-2">
            {processInlineFormatting(line.substring(4))}
          </h3>,
        )
      } else if (line.startsWith("#### ")) {
        result.push(
          <h4 key={`h4-${i}`} className="text-base font-bold my-1">
            {processInlineFormatting(line.substring(5))}
          </h4>,
        )
      }

      // Process unordered lists
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        result.push(
          <div key={`list-${i}`} className="flex my-1">
            <span className="mr-2">•</span>
            <div>{processInlineFormatting(line.substring(2))}</div>
          </div>,
        )
      }

      // Process ordered lists
      else if (/^\d+\.\s/.test(line)) {
        const number = line.match(/^\d+/)?.[0]
        result.push(
          <div key={`olist-${i}`} className="flex my-1">
            <span className="mr-2">{number}.</span>
            <div>{processInlineFormatting(line.substring(number!.length + 2))}</div>
          </div>,
        )
      }

      // Process blockquotes
      else if (line.startsWith("> ")) {
        result.push(
          <blockquote key={`quote-${i}`} className="border-l-2 border-neutral-500 pl-3 my-2 italic">
            {processInlineFormatting(line.substring(2))}
          </blockquote>,
        )
      }

      // Process horizontal dividers (---)
      else if (line.match(/^-{3,}$/)) {
        result.push(<hr key={`hr-${i}`} className="my-4 border-t border-neutral-600" />)
      }

      // Regular paragraph with inline formatting
      else {
        result.push(
          <React.Fragment key={`p-${i}`}>
            {processInlineFormatting(line)}
            {i < lines.length - 1 && !lines[i + 1].startsWith("#") && !lines[i + 1].startsWith("```") && <br />}
          </React.Fragment>,
        )
      }
    }

    // Handle unclosed code block
    if (inCodeBlock) {
      if (!monacoFailed) {
        try {
          result.push(
            <MonacoCodeBlock key={`code-${codeBlockIndex}`} language={codeBlockLanguage}>
              {codeBlockContent}
            </MonacoCodeBlock>,
          )
        } catch (error) {
          console.error("Monaco editor failed to load:", error)
          setMonacoFailed(true)
          result.push(
            <FallbackCodeBlock key={`code-${codeBlockIndex}`} language={codeBlockLanguage}>
              {codeBlockContent}
            </FallbackCodeBlock>,
          )
        }
      } else {
        result.push(
          <FallbackCodeBlock key={`code-${codeBlockIndex}`} language={codeBlockLanguage}>
            {codeBlockContent}
          </FallbackCodeBlock>,
        )
      }
    }

    return result
  }, [text, monacoFailed])

  // Process inline formatting like bold, italic, code, etc.
  function processInlineFormatting(text: string) {
    if (!text) return text

    // Split the text by formatting markers
    const segments: React.ReactNode[] = []
    let currentText = text
    let key = 0

    // Process inline code (`code`)
    while (currentText.includes("`") && !currentText.startsWith("```")) {
      const startIndex = currentText.indexOf("`")
      const endIndex = currentText.indexOf("`", startIndex + 1)

      if (endIndex === -1) break

      // Add text before the code marker
      if (startIndex > 0) {
        segments.push(<span key={key++}>{currentText.substring(0, startIndex)}</span>)
      }

      // Add the inline code
      segments.push(
        <code key={key++} className="bg-[#171717] px-1 py-0.5 rounded text-sm font-mono">
          {currentText.substring(startIndex + 1, endIndex)}
        </code>,
      )

      // Update the current text
      currentText = currentText.substring(endIndex + 1)
    }

    // Process bold (**text**)
    while (currentText.includes("**")) {
      const startIndex = currentText.indexOf("**")
      const endIndex = currentText.indexOf("**", startIndex + 2)

      if (endIndex === -1) break

      // Add text before the bold marker
      if (startIndex > 0) {
        segments.push(<span key={key++}>{currentText.substring(0, startIndex)}</span>)
      }

      // Add the bold text
      segments.push(
        <strong key={key++} className="font-bold">
          {currentText.substring(startIndex + 2, endIndex)}
        </strong>,
      )

      // Update the current text
      currentText = currentText.substring(endIndex + 2)
    }

    // Add any remaining text
    if (currentText) {
      segments.push(<span key={key++}>{currentText}</span>)
    }

    // If no formatting was applied, return the original text

    if (segments.length === 0) {
      return text
    }

    return segments
  }

  return <div className={cn("whitespace-pre-wrap", className)}>{formattedText}</div>
}
