"use client"

import { useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, ImageIcon, Mic } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface ChatInputProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onAttachImage: () => void
  onToggleSpeech: () => void
  isTyping: boolean
  isPendingCreation: boolean
  isListening: boolean
  recognitionSupported: boolean
  recognitionLang: string
}

export default function ChatInput({
  inputValue,
  onInputChange,
  onSendMessage,
  onAttachImage,
  onToggleSpeech,
  isTyping,
  isPendingCreation,
  isListening,
  recognitionSupported,
  recognitionLang,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value)
  }

  return (
    <div className="relative flex items-end gap-2 p-4 border-t border-border">
      {/* Hidden file input for image attachment */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result as string
              onInputChange(base64)
            }
            reader.readAsDataURL(file)
          }
        }}
      />

      {/* Image attachment button */}
      <button
        onClick={onAttachImage}
        disabled={isTyping || isPendingCreation}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ImageIcon size={20} />
      </button>

      {/* Speech recognition button */}
      {recognitionSupported && (
        <button
          onClick={onToggleSpeech}
          disabled={isTyping || isPendingCreation}
          className={`p-2 transition-colors disabled:opacity-50 ${
            isListening ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic size={20} />
        </button>
      )}

      {/* Chat input */}
      <div className="flex-1 relative">
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[44px] max-h-[200px] pr-12 resize-none"
          disabled={isTyping || isPendingCreation}
        />
        <button
          onClick={onSendMessage}
          disabled={!inputValue.trim() || isTyping || isPendingCreation}
          className="absolute right-2 bottom-2 p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  )
} 