"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Download, PlayCircle, X } from "lucide-react"
import { getLanguageName } from "@/utils/code-utils"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

// Dynamically import Monaco Editor with no SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1e1e1e] p-4 rounded-b-lg h-[300px] flex items-center justify-center">
      <div className="loader-small"></div>
    </div>
  ),
})

interface MonacoCodeBlockProps {
  language?: string
  title?: string
  children: string
  initialContent?: string
  showLineNumbers?: boolean
  className?: string
  readOnly?: boolean
  height?: string
  onChange?: (value: string) => void
}

export default function MonacoCodeBlock({
  language = "javascript",
  title,
  children,
  initialContent,
  showLineNumbers = true,
  className,
  readOnly = true,
  height = "300px",
  onChange,
}: MonacoCodeBlockProps) {
  // Use initialContent if provided, otherwise fall back to children
  const contentToDisplay = initialContent || children

  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Make sure we don't lose any updates to children
  const [code, setCode] = useState(contentToDisplay)

  useEffect(() => {
    // When children or initialContent props change, update the code state
    setCode(initialContent || children)
  }, [children, initialContent])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)

      // Create file extension based on language
      const getFileExtension = (lang: string): string => {
        const extensionMap: Record<string, string> = {
          javascript: "js",
          typescript: "ts",
          jsx: "jsx",
          tsx: "tsx",
          html: "html",
          css: "css",
          json: "json",
          python: "py",
          java: "java",
          c: "c",
          cpp: "cpp",
          csharp: "cs",
          go: "go",
          rust: "rs",
          ruby: "rb",
          php: "php",
          swift: "swift",
          kotlin: "kt",
          sql: "sql",
          shell: "sh",
          bash: "sh",
          yaml: "yaml",
          markdown: "md",
        }
        return extensionMap[lang.toLowerCase()] || "txt"
      }

      // Create a blob with the code content
      const blob = new Blob([code], { type: "text/plain" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `code.${getFileExtension(language)}`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloading(false)
      }, 100)
    } catch (err) {
      console.error("Failed to download code:", err)
      setDownloading(false)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
      onChange?.(value)
    }
  }

  // Map language to Monaco's supported languages
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      java: "java",
      go: "go",
      rust: "rust",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      php: "php",
      swift: "swift",
      kotlin: "kotlin",
      sql: "sql",
      sh: "shell",
      bash: "shell",
      yaml: "yaml",
      md: "markdown",
      json: "json",
      html: "html",
      css: "css",
    }

    return languageMap[lang.toLowerCase()] || lang.toLowerCase()
  }

  // Check if code is runnable in browser
  const isRunnableCode = (): boolean => {
    const normalizedLang = getMonacoLanguage(language).toLowerCase()
    return ["html", "javascript", "jsx", "tsx", "css"].includes(normalizedLang)
  }

  const handleRunCode = () => {
    setPreviewOpen(true)
  }

  // Debug log to check if button should be visible
  console.log(`Language: ${language}, Normalized: ${getMonacoLanguage(language)}, Runnable: ${isRunnableCode()}`)

  return (
    <div className={cn("my-4 relative", className)}>
      <div className="code-header flex justify-between items-center">
        <span className="text-xs text-neutral-400 font-mono">{title || getLanguageName(language)}</span>
        <div className="flex items-center gap-2">
          {isRunnableCode() && (
            <button
              onClick={handleRunCode}
              className="text-neutral-400 hover:text-green-500 transition-colors"
              aria-label="Run code"
              title="Run code"
            >
              <PlayCircle size={18} className="text-green-500" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Download code"
            title="Download code"
            disabled={downloading}
          >
            <Download size={16} className={downloading ? "animate-pulse" : ""} />
          </button>
          <button
            onClick={handleCopy}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="border border-neutral-800 rounded-b-lg overflow-hidden mt-1">
        <MonacoEditor
          height={height}
          language={getMonacoLanguage(language)}
          value={code}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: {
              enabled: true,
              side: "right",
              showSlider: "mouseover",
              renderCharacters: false,
              maxColumn: 60,
              scale: 0.8,
            },
            scrollBeyondLastLine: false,
            lineNumbers: showLineNumbers ? "on" : "off",
            renderLineHighlight: "none",
            folding: true,
            fontSize: 14,
            fontFamily:
              "var(--font-geist-sans), var(--font-geist-mono), 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
            fontLigatures: true,
            tabSize: 2,
            automaticLayout: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            domReadOnly: readOnly,
            padding: { top: 8 },
            guides: {
              indentation: true,
              bracketPairs: true,
              bracketPairsHorizontal: true,
            },
          }}
          onChange={handleEditorChange}
          className="monaco-editor-container"
        />
      </div>
      {previewOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 font-geist">
          <div className="bg-neutral-900 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-neutral-800">
              <h3 className="text-sm font-medium font-geist">Code Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-white p-0">
              <iframe
                srcDoc={
                  getMonacoLanguage(language) === "html"
                    ? code
                    : `<!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Geist+Sans:wght@300;400;500;600;700&display=swap');
                            body {
                              font-family: 'Geist Sans', system-ui, -apple-system, sans-serif;
                              padding: 20px;
                              line-height: 1.5;
                            }
                            ${getMonacoLanguage(language) === "css" ? code : ""}
                          </style>
                        </head>
                        <body>
                          ${getMonacoLanguage(language) !== "css" ? code : "<div>CSS applied to this page</div>"}
                        </body>
                      </html>`
                }
                className="w-full h-full border-0"
                title="Code Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
