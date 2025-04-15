"use client"

import { useState, useRef, useEffect } from "react"
import { X, Download, Copy, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import FormattedText from "./formatted-text"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

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
  const contentRef = useRef<HTMLDivElement>(null)

  // Update edited content when the input content changes
  useEffect(() => {
    setEditedContent(content)
  }, [content])

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

  // Update the handleExportPDF function to support multiple pages

  // Handle export to PDF
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
      contentClone.style.position = "absolute"
      contentClone.style.left = "-9999px"
      document.body.appendChild(contentClone)

      // Convert to canvas
      const canvas = await html2canvas(contentClone, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher scale for better quality
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

      // Save the PDF
      pdf.save("orphion-canvas.pdf")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
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
                  onClick={handleCopy}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Export as PDF"
                  disabled={isExporting}
                >
                  <Download size={20} className={isExporting ? "animate-pulse" : ""} />
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md"
                >
                  Edit
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Close canvas">
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
            <div ref={contentRef} className="prose prose-lg max-w-none text-gray-900">
              <FormattedText text={editedContent} useMonaco={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
