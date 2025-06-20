"use client"

import { useState } from "react"
import React from "react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import FallbackMathRenderer from "./fallback-math-renderer"
import TableRenderer from "./table-renderer"
import ChartRenderer from "./chart-renderer"
import KaTeXRenderer from "./katex-renderer"

// Dynamically import Monaco code block with no SSR
const MonacoCodeBlock = dynamic(() => import("./monaco-code-block"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg h-[300px] flex items-center justify-center">
      <div className="loader-small"></div>
    </div>
  ),
})

interface FormattedTextProps {
  text: string
  className?: string
  useMonaco?: boolean
  useMathjax?: boolean
  theme?: "light" | "dark"
}

export default function FormattedText({
  text,
  className,
  useMonaco = true,
  useMathjax = false,
  theme = "dark",
}: FormattedTextProps) {
  const [mathjaxFailed, setMathjaxFailed] = useState(false)

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
    let inMathBlock = false
    let mathBlockContent = ""
    let mathBlockIndex = 0
    let inTableBlock = false
    let tableRows: string[] = []
    let inChartBlock = false
    let chartContent = ""

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle chart blocks (\`\`\`chart)
      if (line.startsWith("```chart")) {
        inChartBlock = true
        chartContent = ""
        i++ // Skip the opening line
        continue
      }

      if (inChartBlock) {
        if (line.startsWith("```")) {
          // End of chart block
          inChartBlock = false
          try {
            result.push(
              <div key={`chart-${codeBlockIndex++}`} className="my-4">
                <ChartRenderer chartData={chartContent} />
              </div>,
            )
          } catch (error) {
            console.error("Error rendering chart:", error)
            result.push(
              <div
                key={`chart-error-${codeBlockIndex++}`}
                className="my-4 p-4 bg-red-900/20 border border-red-800 rounded-lg"
              >
                <p className="text-red-400">Error rendering chart. Please check the chart data format.</p>
                <pre className="mt-2 text-xs text-neutral-400 overflow-auto">{chartContent}</pre>
              </div>,
            )
          }
        } else {
          chartContent += line + "\n"
        }
        continue
      }

      // Handle table detection
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        if (!inTableBlock) {
          inTableBlock = true
          tableRows = [line]
        } else {
          tableRows.push(line)
        }
        continue
      } else if (inTableBlock) {
        // End of table block
        inTableBlock = false
        result.push(
          <div key={`table-${tableRows.join("-").hashCode()}`} className="my-4">
            <TableRenderer tableRows={tableRows} theme={theme} />
          </div>,
        )
      }

      // Handle math blocks ($...$)
      if (line.trim() === "$$" || (line.trim().startsWith("$$") && line.trim().endsWith("$$"))) {
        if (!inMathBlock) {
          // Start of math block
          inMathBlock = true
          mathBlockContent = line.trim() === "$$" ? "" : line.trim().slice(2, -2)
        } else {
          // End of math block
          inMathBlock = false

          // If the math content is from a single line ($...$), we already have it
          // Otherwise, we need to add the current line to the content
          if (line.trim() !== "$$") {
            mathBlockContent += "\n" + line.trim().slice(0, -2)
          }

          result.push(
            <div key={`math-block-${mathBlockIndex++}`} className="my-4 flex justify-center">
              {mathjaxFailed ? (
                <FallbackMathRenderer math={mathBlockContent} block={true} theme={theme} />
              ) : (
                <KaTeXRenderer
                  math={mathBlockContent}
                  block={true}
                  onError={() => setMathjaxFailed(true)}
                  theme={theme}
                />
              )}
            </div>,
          )
          mathBlockContent = ""
        }
        continue
      }

      // Collect content for math block
      if (inMathBlock) {
        mathBlockContent += (mathBlockContent ? "\n" : "") + line
        continue
      }

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

          // Always use Monaco editor
          result.push(
            <MonacoCodeBlock
              key={`code-${codeBlockIndex++}`}
              language={codeBlockLanguage}
              initialContent={codeBlockContent}
            >
              {codeBlockContent}
            </MonacoCodeBlock>,
          )

          // Add explanatory text that might follow the code block
          const explanatoryText: string[] = []
          let j = i + 1
          while (
            j < lines.length &&
            !lines[j].startsWith("```") &&
            !lines[j].match(/^#+\s/) &&
            !lines[j].trim().startsWith("$$")
          ) {
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

      // Process \[...\] math blocks
      else if (line.trim().startsWith("\\[") || line.trim() === "\\[") {
        // Start of math block with \[
        let mathContent = ""
        let j = i

        // If the opening and closing are on the same line
        if (line.includes("\\]")) {
          mathContent = line.substring(line.indexOf("\\[") + 2, line.indexOf("\\]"))
          result.push(
            <div key={`math-block-${mathBlockIndex++}`} className="my-4 flex justify-center">
              {mathjaxFailed ? (
                <FallbackMathRenderer math={mathContent} block={true} theme={theme} />
              ) : (
                <KaTeXRenderer
                  math={mathContent}
                  block={true}
                  onError={() => setMathjaxFailed(true)}
                  theme={theme}
                />
              )}
            </div>,
          )
          continue // Skip to next line after processing
        } else {
          // Multi-line math block
          while (j < lines.length && !lines[j].includes("\\]")) {
            if (j === i) {
              // First line, remove \[
              mathContent += lines[j].substring(lines[j].indexOf("\\[") + 2)
            } else {
              mathContent += lines[j]
            }
            mathContent += "\n"
            j++
          }

          // Add the last line up to \]
          if (j < lines.length && lines[j].includes("\\]")) {
            mathContent += lines[j].substring(0, lines[j].indexOf("\\]"))

            result.push(
              <div key={`math-block-${mathBlockIndex++}`} className="my-4 flex justify-center">
                {mathjaxFailed ? (
                  <FallbackMathRenderer math={mathContent} block={true} theme={theme} />
                ) : (
                  <KaTeXRenderer
                    math={mathContent}
                    block={true}
                    onError={() => setMathjaxFailed(true)}
                    theme={theme}
                  />
                )}
              </div>,
            )

            i = j // Skip to the end of the math block
            continue // Skip to next line after processing
          }
        }
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
      else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        const bulletChar = line.startsWith("- ") ? "-" : line.startsWith("* ") ? "*" : "•"
        const content = line.substring(bulletChar === "•" ? 2 : 2)

        result.push(
          <div key={`list-${i}`} className="flex my-1">
            <span className="mr-2">•</span>
            <div>{processInlineFormatting(content)}</div>
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
            {i < lines.length - 1 &&
              !lines[i + 1].startsWith("#") &&
              !lines[i + 1].startsWith("```") &&
              !lines[i + 1].trim().startsWith("$$") && <br />}
          </React.Fragment>,
        )
      }
    }

    // Handle unclosed blocks
    if (inCodeBlock) {
      result.push(
        <MonacoCodeBlock key={`code-${codeBlockIndex}`} language={codeBlockLanguage} initialContent={codeBlockContent}>
          {codeBlockContent}
        </MonacoCodeBlock>,
      )
    }

    if (inMathBlock) {
      result.push(
        <div key={`math-block-${mathBlockIndex}`} className="my-4 flex justify-center">
          {mathjaxFailed ? (
            <FallbackMathRenderer math={mathBlockContent} block={true} theme={theme} />
          ) : (
            <KaTeXRenderer
              math={mathBlockContent}
              block={true}
              onError={() => setMathjaxFailed(true)}
              theme={theme}
            />
          )}
        </div>,
      )
    }

    if (inTableBlock && tableRows.length > 0) {
      result.push(
        <div key={`table-${tableRows.join("-").hashCode()}`} className="my-4">
          <TableRenderer tableRows={tableRows} theme={theme} />
        </div>,
      )
    }

    if (inChartBlock && chartContent) {
      try {
        result.push(
          <div key={`chart-${codeBlockIndex}`} className="my-4">
            <ChartRenderer chartData={chartContent} />
          </div>,
        )
      } catch (error) {
        console.error("Error rendering chart:", error)
        result.push(
          <div
            key={`chart-error-${codeBlockIndex}`}
            className="my-4 p-4 bg-red-900/20 border border-red-800 rounded-lg"
          >
            <p className="text-red-400">Error rendering chart. Please check the chart data format.</p>
            <pre className="mt-2 text-xs text-neutral-400 overflow-auto">{chartContent}</pre>
          </div>,
        )
      }
    }

    return result
  }, [text, mathjaxFailed, theme])

  // Process inline formatting like bold, italic, code, math, etc.
  function processInlineFormatting(text: string) {
    if (!text) return null

    // Split by inline math expressions ($...$)
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/)
    return parts.map((part, index) => {
      // Check if this part is a math expression
      if (part.startsWith("$") && part.endsWith("$")) {
        const isBlock = part.startsWith("$$")
        const mathContent = part.slice(isBlock ? 2 : 1, -1).trim()
        
        return (
          <React.Fragment key={index}>
            {mathjaxFailed ? (
              <FallbackMathRenderer math={mathContent} block={isBlock} theme={theme} />
            ) : (
              <KaTeXRenderer
                math={mathContent}
                block={isBlock}
                onError={() => setMathjaxFailed(true)}
                theme={theme}
              />
            )}
          </React.Fragment>
        )
      }

      // Process other inline formatting (bold, italic, etc.)
      let processedText = part
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      processedText = processedText.replace(/\*(.*?)\*/g, "<em>$1</em>")
      processedText = processedText.replace(/`(.*?)`/g, "<code>$1</code>")

      return <span key={index} dangerouslySetInnerHTML={{ __html: processedText }} />
    })
  }

  return <div className={cn("whitespace-pre-wrap", className)}>{formattedText}</div>
}

// Add a hashCode method to String prototype for generating unique keys for tables
declare global {
  interface String {
    hashCode(): number
  }
}

String.prototype.hashCode = function () {
  let hash = 0
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
