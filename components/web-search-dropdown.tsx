"use client"

import { useEffect, useRef } from "react"
import { Check } from "lucide-react"

interface WebSearchDropdownProps {
  isOpen: boolean
  onClose: () => void
  showSources: boolean
  showImages: boolean
  onToggleSources: () => void
  onToggleImages: () => void
}

export default function WebSearchDropdown({
  isOpen,
  onClose,
  showSources,
  showImages,
  onToggleSources,
  onToggleImages,
}: WebSearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full mb-2 right-0 bg-[#1a1a1a] border border-neutral-800 rounded-lg shadow-lg p-2 w-64 animate-fadeIn z-10"
    >
      <p className="text-xs text-neutral-500 px-2 mb-2">Web Search Options</p>

      <div
        className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-red-800 cursor-pointer"
        onClick={onToggleSources}
      >
        <span className="text-sm text-neutral-300">Display Sources</span>
        <div
          className={`w-4 h-4 rounded-sm flex items-center justify-center ${showSources ? "bg-white" : "border border-neutral-500"}`}
        >
          {showSources && <Check size={12} className="text-black" />}
        </div>
      </div>

      <div
        className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-red-800 cursor-pointer"
        onClick={onToggleImages}
      >
        <span className="text-sm text-neutral-300">Display Images</span>
        <div
          className={`w-4 h-4 rounded-sm flex items-center justify-center ${showImages ? "bg-white" : "border border-neutral-500"}`}
        >
          {showImages && <Check size={12} className="text-black" />}
        </div>
      </div>
    </div>
  )
}
