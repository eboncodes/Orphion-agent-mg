"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Paperclip } from "lucide-react"

interface ImageAttachmentProps {
  onImageAttached: (imageData: string | null) => void
  disabled?: boolean
}

export default function ImageAttachment({ onImageAttached, disabled = false }: ImageAttachmentProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 4MB)
    const MAX_SIZE = 4 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      alert("Image size should be less than 4MB")
      return
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WEBP)")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setPreviewUrl(base64)
      onImageAttached(base64)
    }
    reader.readAsDataURL(file)
  }

  // Clear the image
  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onImageAttached(null)
  }

  // Trigger file input click
  const handleAttachClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Attachment button */}
      <button
        type="button"
        onClick={handleAttachClick}
        className={`text-neutral-500 hover:text-neutral-300 transition-colors ${
          previewUrl ? "opacity-0 pointer-events-none" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={disabled}
        aria-label="Attach image"
        title="Attach image"
      >
        <Paperclip size={20} className="rotate-45" />
      </button>

      {/* Image preview */}
      {previewUrl && (
        <div ref={previewRef} className="absolute z-20 bottom-0 left-0 group" title="Attached image">
          <div className="relative">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-[30px] h-[30px] rounded object-cover border border-neutral-700 transition-all hover:brightness-75"
            />
            <button
              onClick={clearImage}
              className="absolute top-[-5px] right-[-5px] bg-neutral-800 bg-opacity-70 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
