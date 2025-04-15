"use client"

import { useState, useEffect } from "react"
import { Copy, RefreshCw, Volume2, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageActionsProps {
  messageContent: string
  onRegenerate?: () => void
  onOpenCanvas?: () => void
  className?: string
  isWebSearch?: boolean
}

export default function MessageActions({
  messageContent,
  onRegenerate,
  onOpenCanvas,
  className,
  isWebSearch = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  // Load available voices when component mounts
  useEffect(() => {
    // Function to load and set available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      if (availableVoices.length > 0) {
        setVoices(availableVoices)
        setVoicesLoaded(true)
      }
    }

    // Load voices immediately if they're already available
    loadVoices()

    // Set up event listener for when voices change/load
    window.speechSynthesis.onvoiceschanged = loadVoices

    // Cleanup
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Copy message to clipboard
  const handleCopy = async () => {
    try {
      // Strip any HTML tags when copying to clipboard
      const plainText = messageContent.replace(/<[^>]*>/g, "")
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Handle regenerate action
  const handleRegenerate = () => {
    if (onRegenerate) onRegenerate()
  }

  // Handle canvas action
  const handleOpenCanvas = () => {
    if (onOpenCanvas) onOpenCanvas()
  }

  // Get the best available voice
  const getBestVoice = (): SpeechSynthesisVoice | null => {
    if (!voicesLoaded || voices.length === 0) return null

    // Priority list of preferred voices (modern/neural voices first)
    const preferredVoices = [
      // Google neural voices
      { name: "Google UK English Female", lang: "en-GB" },
      { name: "Google UK English Male", lang: "en-GB" },
      { name: "Google US English", lang: "en-US" },

      // Microsoft neural voices
      { name: "Microsoft Aria Online (Natural)", lang: "en-US" },
      { name: "Microsoft Guy Online (Natural)", lang: "en-US" },
      { name: "Microsoft Jenny Online (Natural)", lang: "en-US" },

      // Apple neural voices
      { name: "Samantha", lang: "en-US" },
      { name: "Daniel", lang: "en-GB" },
    ]

    // Try to find one of our preferred voices
    for (const preferred of preferredVoices) {
      const match = voices.find((voice) => voice.name.includes(preferred.name) && voice.lang.includes(preferred.lang))
      if (match) return match
    }

    // Fallback: Try to find any English neural/premium voice
    const premiumVoice = voices.find(
      (voice) =>
        (voice.name.includes("Neural") || voice.name.includes("Premium") || voice.name.includes("Enhanced")) &&
        (voice.lang.includes("en-US") || voice.lang.includes("en-GB")),
    )
    if (premiumVoice) return premiumVoice

    // Fallback: Any English voice
    const englishVoice = voices.find((voice) => voice.lang.includes("en-US") || voice.lang.includes("en-GB"))
    if (englishVoice) return englishVoice

    // Last resort: first available voice
    return voices[0]
  }

  // Handle speak action with improved voice selection
  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      console.error("Text-to-speech not supported in this browser")
      return
    }

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(messageContent)

    // Set up event handlers
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event)
      setSpeaking(false)
    }

    // Get the best available voice
    const bestVoice = getBestVoice()
    if (bestVoice) {
      console.log("Using voice:", bestVoice.name)
      utterance.voice = bestVoice
    }

    // Configure voice settings for better quality
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Start speaking
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <div className={cn("flex items-center gap-2 mt-2 text-neutral-500", className)}>
      <button
        onClick={handleCopy}
        className="p-1 hover:text-neutral-300 transition-colors rounded-md hover:bg-neutral-800/50"
        aria-label={copied ? "Copied" : "Copy message"}
        title={copied ? "Copied" : "Copy message"}
      >
        <Copy size={16} />
      </button>

      {/* Only show regenerate button if not a web search result and onRegenerate is provided */}
      {!isWebSearch && onRegenerate && (
        <button
          onClick={handleRegenerate}
          className="p-1 hover:text-neutral-300 transition-colors rounded-md hover:bg-neutral-800/50"
          aria-label="Regenerate response"
          title="Regenerate response"
        >
          <RefreshCw size={16} />
        </button>
      )}

      <button
        onClick={handleSpeak}
        className={cn(
          "p-1 hover:text-neutral-300 transition-colors rounded-md hover:bg-neutral-800/50",
          speaking && "text-blue-500 hover:text-blue-400",
        )}
        aria-label={speaking ? "Stop speaking" : "Speak message"}
        title={speaking ? "Stop speaking" : "Speak message"}
      >
        <Volume2 size={16} />
      </button>

      {/* Canvas button */}
      <button
        onClick={handleOpenCanvas}
        className="p-1 hover:text-neutral-300 transition-colors rounded-md hover:bg-neutral-800/50"
        aria-label="Open in canvas"
        title="Open in canvas"
      >
        <Edit size={16} />
      </button>
    </div>
  )
}
