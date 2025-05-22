"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Download, Copy, Check, FileUp, Loader2, FileText } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import FormattedText from "./formatted-text"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import mammoth from "mammoth"
import { Document, Packer, Paragraph, HeadingLevel } from "docx"
import FileSaver from "file-saver"
import { delay } from "@/lib/utils"

// First, update the imports to include the PDF.js library
// Add these imports at the top with the other imports
import * as pdfjs from "pdfjs-dist"
import { getDocument } from "pdfjs-dist"

// Add this line after the other imports to set the PDF.js worker
// This is necessary for PDF.js to work in the browser
import { GlobalWorkerOptions } from "pdfjs-dist"

// Add this after the other imports
// Set the worker source for PDF.js
if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

// Update the canvasStyles to better match text colors and remove backgrounds
const canvasStyles = `
  .canvas-content .math-renderer,
  .canvas-content .mathjax-renderer,
  .canvas-content .mathjax-block,
  .canvas-content .mathjax-inline {
    color: #000 !important;
    background-color: transparent !important;
  }
  
  .canvas-content .MathJax {
    color: #000 !important;
  }
  
  .canvas-content .MathJax svg {
    fill: #000 !important;
  }

  .canvas-content table {
    background-color: transparent !important;
  }
  
  .canvas-content table th,
  .canvas-content table td {
    background-color: transparent !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }
  
  .canvas-content table tr:nth-child(even),
  .canvas-content table tr:nth-child(odd),
  .canvas-content table tr:hover {
    background-color: transparent !important;
  }
`

interface CanvasPanelProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onSave: (content: string) => void
}

export default function CanvasPanel({ isOpen, onClose, content, onSave }: CanvasPanelProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [isCopied, setIsCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)

  // Update edited content when the input content changes
  useEffect(() => {
    setEditedContent(content)
  }, [content])

  useEffect(() => {
    setIsClient(true)

    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Canvas operations here
    // ...
  }, [])

  // Handle save
  const handleSave = () => {
    onSave(editedContent)
    setEditMode(false)
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  // Fixed PDF export function
  const handleExportPDF = async () => {
    if (!contentRef.current) return

    setIsExporting(true)

    try {
      // Create a clone of the content div with white background for PDF
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement
      contentClone.style.backgroundColor = "white"
      contentClone.style.color = "black"
      contentClone.style.padding = "40px"
      contentClone.style.width = "800px"

      // Append to document but make it invisible
      contentClone.style.position = "fixed"
      contentClone.style.left = "-9999px"
      contentClone.style.top = "0"
      contentClone.style.zIndex = "-1000"
      document.body.appendChild(contentClone)

      // Wait for MathJax to finish rendering if it exists
      if (window.MathJax) {
        try {
          await window.MathJax.typesetPromise([contentClone])
          console.log("MathJax typesetting completed")
        } catch (err) {
          console.error("MathJax typesetting error:", err)
        }
      }

      // Add a small delay to ensure all rendering is complete
      await delay(1000)

      // Convert to canvas with better settings for math
      const canvas = await html2canvas(contentClone, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Additional processing on the cloned document if needed
          const mathElements = clonedDoc.querySelectorAll(".MathJax")
          mathElements.forEach((el) => {
            // Ensure SVG elements are properly styled
            const svgs = el.querySelectorAll("svg")
            svgs.forEach((svg) => {
              svg.setAttribute("fill", "#000000")
            })
          })
        },
      })

      // Remove the clone
      document.body.removeChild(contentClone)

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Calculate dimensions to fit the content on the page
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Calculate the number of pages needed
      const pagesNeeded = Math.ceil(imgHeight / pageHeight)

      // Add content across multiple pages if needed
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight // Negative value to move up
        pdf.addPage()
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save the PDF using saveAs for better browser compatibility
      pdf.save("orphion-canvas.pdf")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      alert("Failed to export as PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  // Fixed Word export function
  const handleExportWord = async () => {
    if (!contentRef.current) return

    setIsExportingWord(true)

    try {
      // Create a simplified version of the content for Word export
      const textContent = editedContent

      // Create paragraphs from the content
      const paragraphs = textContent.split("\n\n").map((paragraph) => {
        // Check if this is a heading
        if (paragraph.startsWith("# ")) {
          return new Paragraph({
            text: paragraph.substring(2),
            heading: HeadingLevel.HEADING_1,
          })
        } else if (paragraph.startsWith("## ")) {
          return new Paragraph({
            text: paragraph.substring(3),
            heading: HeadingLevel.HEADING_2,
          })
        } else if (paragraph.startsWith("### ")) {
          return new Paragraph({
            text: paragraph.substring(4),
            heading: HeadingLevel.HEADING_3,
          })
        } else {
          // Regular paragraph
          return new Paragraph({
            text: paragraph,
          })
        }
      })

      // Create Word document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      })

      // Generate the document buffer
      const buffer = await Packer.toBuffer(doc)

      // Use file-saver to save the document
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      FileSaver.saveAs(blob, "orphion-canvas.docx")
    } catch (error) {
      console.error("Error exporting to Word:", error)
      alert("Failed to export as Word document. Please try again.")
    } finally {
      setIsExportingWord(false)
    }
  }

  // Handle file import
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      // Get file extension
      const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
      const fileType = file.type

      // Handle Word documents (.docx)
      if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileExt === "docx"
      ) {
        // Convert Word document to markdown
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToMarkdown({ arrayBuffer })
        const extractedContent = result.value

        // Add the content to the editor
        setEditedContent((prev) => prev + "\n\n" + extractedContent)
        setEditMode(true)
      }
      // Handle PDF files
      else if (fileType === "application/pdf" || fileExt === "pdf") {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await getDocument({ data: arrayBuffer }).promise

        let extractedText = ""

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(" ")
          extractedText += pageText + "\n\n"
        }

        // Add the extracted text to the editor
        setEditedContent((prev) => prev + "\n\n" + extractedText)
        setEditMode(true)
      }
      // Handle code and text files
      else if (
        fileType.startsWith("text/") ||
        fileExt === "js" ||
        fileExt === "ts" ||
        fileExt === "jsx" ||
        fileExt === "tsx" ||
        fileExt === "html" ||
        fileExt === "css" ||
        fileExt === "json" ||
        fileExt === "md"
      ) {
        const text = await file.text()

        // Format code files with markdown code blocks
        let formattedContent = ""

        // Determine language for code block
        let language = ""
        switch (fileExt) {
          case "js":
            language = "javascript"
            break
          case "ts":
            language = "typescript"
            break
          case "jsx":
            language = "jsx"
            break
          case "tsx":
            language = "tsx"
            break
          case "html":
            language = "html"
            break
          case "css":
            language = "css"
            break
          case "json":
            language = "json"
            break
          case "md":
            language = "markdown"
            break
          default:
            language = "text"
            break
        }

        // If it's a code file, wrap it in a code block
        if (language !== "text" && language !== "markdown") {
          formattedContent = `\n\n\`\`\`${language}\n${text}\n\`\`\`\n`
        } else {
          formattedContent = `\n\n${text}\n`
        }

        // Add the content to the editor
        setEditedContent((prev) => prev + formattedContent)
        setEditMode(true)
      } else {
        alert("Unsupported file type. Please upload a .docx, .pdf, or text/code file.")
      }
    } catch (error) {
      console.error("Error importing file:", error)
      alert(`Failed to import file: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      {isOpen && <style dangerouslySetInnerHTML={{ __html: canvasStyles }} />}
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Canvas panel */}
        <div className="relative w-full max-w-3xl bg-white h-full overflow-hidden animate-slideInRight">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-medium text-gray-900">Canvas</h2>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleImportClick}
                    className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md"
                    title="Import document or code file"
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 size={16} className="mr-1 animate-spin" />
                    ) : (
                      <FileUp size={16} className="mr-1" />
                    )}
                    Import File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".docx,.pdf,.txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain,text/javascript,text/typescript,text/html,text/css,application/json,text/markdown"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleExportWord}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                      title="Download as Word document"
                      disabled={isExportingWord}
                    >
                      {isExportingWord ? (
                        <Loader2 size={16} className="mr-1 animate-spin" />
                      ) : (
                        <FileText size={16} className="mr-1" />
                      )}
                      Word
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                      title="Download as PDF"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 size={16} className="mr-1 animate-spin" />
                      ) : (
                        <Download size={16} className="mr-1" />
                      )}
                      PDF
                    </button>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md"
                  >
                    Edit
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Close canvas"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-64px)] overflow-y-auto bg-white p-8">
            {editMode ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full min-h-[500px] p-4 text-gray-900 border-gray-300 focus:border-red-500 focus:ring-red-500"
                placeholder="Edit content..."
              />
            ) : (
              <>
                <div ref={contentRef} className="prose prose-lg max-w-none text-gray-900 canvas-content">
                  <FormattedText text={editedContent} useMonaco={false} useMathjax={true} theme="light" />
                </div>
                {isClient && <canvas ref={canvasRef} width={500} height={300} className="border" />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Add this to make TypeScript happy with the window.MathJax property
declare global {
  interface Window {
    MathJax?: any
  }
}
