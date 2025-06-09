"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import type { TavilyImage } from "./web-search-service"

interface ImageViewerProps {
  image: TavilyImage
  onClose: () => void
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="Close image viewer"
        >
          <X size={20} />
        </button>

        {/* Image container */}
        <div className="relative flex-1 flex items-center justify-center bg-neutral-900/50 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="loader-small"></div>
            </div>
          )}

          <img
            src={image.url || "/placeholder.svg"}
            alt={image.title || "Search result image"}
            className="max-w-full max-h-[70vh] object-contain"
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false)
              e.currentTarget.onerror = null
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%23888' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"
            }}
          />
        </div>

        {/* Image info */}
        <div className="mt-4 bg-neutral-900/80 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">{image.title || "Image"}</h3>
          {image.description && <p className="text-neutral-300 text-sm">{image.description}</p>}
        </div>
      </div>
    </div>
  )
}
