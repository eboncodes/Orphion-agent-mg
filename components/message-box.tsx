"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowRight, Paperclip, Menu, X, Mic, Wand2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import OrphionChat from "./orphion-chat"
import type { ChatSession } from "./chat-storage-service"
import { useIsMobile } from "../hooks/use-mobile"
import { getSavedSessions } from "./chat-storage-service"
import { getMissingApiKeys } from "@/utils/api-keys"
import ApiKeyWarning from "./api-key-warning"
import SettingsPopup from "./settings-popup"

interface MessageBoxProps {
  activeChat: ChatSession | null
  onChatEnd: () => void
  onChatCreated: (chat: ChatSession) => void
  onChatUpdated?: (chat: ChatSession) => void
  onSidebarToggle?: () => void
  pendingChatId?: string | null
  showSearchSources?: boolean
  showSearchImages?: boolean
}

// Function to get time-based greeting
const getTimeBasedGreeting = (): { greeting: string; name: string } => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 8) {
    return { greeting: "Good Morning 🌅", name: "early bird" }
  } else if (hour >= 8 && hour < 12) {
    return { greeting: "Good Morning ☀️", name: "friend" }
  } else if (hour >= 12 && hour < 18) {
    return { greeting: "Good Afternoon 🌞", name: "explorer" }
  } else if (hour >= 18 && hour < 22) {
    return { greeting: "Good Evening 🌇", name: "stargazer" }
  } else {
    return { greeting: "Easy Night 🌙", name: "night owl" }
  }
}

// Available speech recognition languages
type SpeechLanguage = {
  code: string
  name: string
  placeholder: string
}

const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: "en-US", name: "English", placeholder: "Speak in English..." },
  { code: "bn-BD", name: "Bangla", placeholder: "বাংলায় বলুন... (Speak in Bangla...)" },
]

// Function to detect language from text
const detectLanguage = (text: string): number => {
  // Simple detection based on first few characters
  // Bangla Unicode range: \u0980-\u09FF
  const firstChar = text.trim()[0] || ""
  const isBangla = /[\u0980-\u09FF]/.test(firstChar)
  return isBangla ? 1 : 0 // 1 for Bangla, 0 for English
}

export default function MessageBox({
  activeChat,
  onChatEnd,
  onChatCreated,
  onChatUpdated,
  onSidebarToggle,
  pendingChatId,
  showSearchSources = false,
  showSearchImages = true,
}: MessageBoxProps) {
  const [inputValue, setInputValue] = useState<string>("")
  const [chatStarted, setChatStarted] = useState<boolean>(false)
  const [initialMessage, setInitialMessage] = useState("")
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(activeChat)
  const [isPendingCreation, setIsPendingCreation] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [selectedMode, setSelectedMode] = useState("General")
  const { isMobile } = useIsMobile()
  const [isStartingChat, setIsStartingChat] = useState<boolean>(false)
  const [localShowSearchSources, setLocalShowSearchSources] = useState(showSearchSources)
  const [localShowSearchImages, setLocalShowSearchImages] = useState(showSearchImages)
  const [showApiKeyWarning, setShowApiKeyWarning] = useState<boolean>(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [greeting, setGreeting] = useState(getTimeBasedGreeting().greeting)
  const [username, setUsername] = useState(getTimeBasedGreeting().name)
  const [isListening, setIsListening] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [showSettingsPopup, setShowSettingsPopup] = useState<boolean>(false)
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0)
  const [recognitionLang, setRecognitionLang] = useState("en-US")

  const messages = [
    "What would you like to do?",
    "How can I assist you today?",
    "I'm here to help!",
    "Ask me anything...",
  ]
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length)
    }, 7000) // Change message every 7 seconds
    return () => clearInterval(interval)
  }, [messages.length])

  // Get current language
  const currentLanguage = SPEECH_LANGUAGES[currentLanguageIndex]

  // Check if speech recognition is supported
  useEffect(() => {
    const isSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    setRecognitionSupported(isSupported)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (recognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = recognitionLang
      recognitionRef.current.interimResults = false
      recognitionRef.current.continuous = false

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue((prev) => prev + transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }
    }
  }, [recognitionSupported, recognitionLang])

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!recognitionSupported) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        // Only auto-detect language if no manual selection has been made and input is not empty
        let langIndex = currentLanguageIndex
        if (inputValue.trim().length > 0) {
          const detectedLangIndex = detectLanguage(inputValue)
          // Only change if it's different and we haven't manually set a preference
          const savedLanguage = localStorage.getItem("orphion-speech-language")
          if (!savedLanguage) {
            langIndex = detectedLangIndex
            setCurrentLanguageIndex(detectedLangIndex)
          }
        }

        // Update language before starting
        recognitionRef.current.lang = SPEECH_LANGUAGES[langIndex].code
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error("Failed to start speech recognition:", error)
        setIsListening(false)
      }
    }
  }

  // Change speech recognition language
  const handleLanguageChange = (index: number) => {
    setCurrentLanguageIndex(index)
    setRecognitionLang(SPEECH_LANGUAGES[index].code)

    // Save preference to localStorage
    localStorage.setItem("orphion-speech-language", index.toString())

    // Update the speech recognition language immediately if supported
    if (recognitionSupported && recognitionRef.current) {
      recognitionRef.current.lang = SPEECH_LANGUAGES[index].code
    }

    // If currently listening, restart with new language
    if (isListening) {
      recognitionRef.current.stop()
      setTimeout(() => {
        recognitionRef.current.lang = SPEECH_LANGUAGES[index].code
        recognitionRef.current.start()
      }, 100)
    }
  }

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("orphion-speech-language")
    if (savedLanguage !== null) {
      const index = Number.parseInt(savedLanguage)
      if (!isNaN(index) && index >= 0 && index < SPEECH_LANGUAGES.length) {
        setCurrentLanguageIndex(index)
      }
    }
  }, [])

  // Update greeting every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeBasedGreeting = getTimeBasedGreeting()
      setGreeting(timeBasedGreeting.greeting)
      setUsername(timeBasedGreeting.name)
    }, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [])

  // Handle active chat changes
  useEffect(() => {
    if (activeChat) {
      setCurrentChat(activeChat)
      setChatStarted(true)
      setIsPendingCreation(false)
    }
  }, [activeChat])

  // Reset UI when activeChat becomes null (returning to home)
  useEffect(() => {
    if (activeChat === null) {
      setChatStarted(false)
      setInputValue("")
      setInitialMessage("")
      setCurrentChat(null)
      setIsTransitioning(false)
      setIsPendingCreation(false)
      setIsStartingChat(false)
      setAttachedImage(null)
    }
  }, [activeChat])

  // Check for pending chat updates
  useEffect(() => {
    if (pendingChatId && !activeChat) {
      // If we have a pending chat ID but no active chat, check if the chat exists
      const checkPendingChat = () => {
        const chats = getSavedSessions()
        const pendingChat = chats.find((chat) => chat.id === pendingChatId)

        if (pendingChat) {
          // If the chat has AI responses (more than 1 message), show it
          if (pendingChat.messages.length > 1) {
            console.log("Pending chat has responses, showing it:", pendingChat.id)
            setCurrentChat(pendingChat)
            setChatStarted(true)

            // Notify parent that chat has been updated
            if (onChatUpdated) {
              onChatUpdated(pendingChat)
            }
          }
        }
      }

      // Check immediately
      checkPendingChat()

      // And set up an interval to check periodically
      const intervalId = setInterval(checkPendingChat, 2000)

      return () => clearInterval(intervalId)
    }
  }, [pendingChatId, activeChat, onChatUpdated])

  // Focus input when appropriate
  useEffect(() => {
    // Focus the input when returning to home screen
    if (!chatStarted && !isTransitioning) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [chatStarted, isTransitioning])

  // Update the useEffect for auto-resizing the textarea
  useEffect(() => {
    if (inputRef.current) {
      if (inputValue === "") {
        // If input is empty, reset to minimum height
        inputRef.current.style.height = "40px"
      } else {
        // Otherwise, adjust height based on content
        inputRef.current.style.height = "40px"
        const scrollHeight = Math.min(inputRef.current.scrollHeight, 72)
        inputRef.current.style.height = `${scrollHeight}px`
      }
    }
  }, [inputValue])

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
      setAttachedImage(base64)
    }
    reader.readAsDataURL(file)
  }

  // Handle image attachment
  const handleAttachImage = () => {
    if (chatStarted || isTransitioning || isStartingChat) return
    fileInputRef.current?.click()
  }

  // Handle starting a new chat
  const handleStartChat = () => {
    if ((inputValue.trim() === "" && !attachedImage) || isStartingChat) return

    // Check if both API keys exist
    const { groq: missingGroq, tavily: missingTavily } = getMissingApiKeys()

    if (missingGroq || missingTavily) {
      // Show API key warning
      setShowApiKeyWarning(true)
      return
    }

    // Set flag to prevent multiple starts
    setIsStartingChat(true)

    // Use default prompt if only image is attached with no text
    const messageContent = inputValue.trim() || (attachedImage ? "What's in this image?" : "")

    console.log("Starting new chat with message:", messageContent, "with image:", !!attachedImage)

    setIsTransitioning(true)
    setInitialMessage(messageContent)
    setIsPendingCreation(true)
    setInputValue("")

    // Make sure we explicitly mark that this message has an attached image
    if (attachedImage) {
      console.log("Setting initial message with attached image")
    }

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "40px"
    }

    // Add a small delay for the transition animation
    setTimeout(() => {
      setChatStarted(true)
      setIsTransitioning(false)

      // Reset the starting flag after a delay
      setTimeout(() => {
        setIsStartingChat(false)
      }, 1000)
    }, 300)
  }

  const handleEndChat = () => {
    setIsTransitioning(true)

    // Add a small delay for the transition animation
    setTimeout(() => {
      setChatStarted(false)
      setInputValue("")
      setInitialMessage("")
      setCurrentChat(null)
      setIsTransitioning(false)
      setIsPendingCreation(false)
      setIsStartingChat(false)
      setAttachedImage(null)
      onChatEnd()
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleStartChat()
    }
    // Shift+Enter will naturally create a new line
  }

  const handleInputFocus = () => {}

  const handleChatCreated = (newChat: ChatSession) => {
    console.log("Chat created in MessageBox:", newChat.id)

    // Only update if we don't already have this chat
    if (!currentChat || currentChat.id !== newChat.id) {
      setCurrentChat(newChat)
      setIsPendingCreation(false)
      onChatCreated(newChat)
    }
  }

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode)
    setShowSettingsPopup(false) // Close settings popup after selection
  }

  // Toggle search sources display
  const toggleSearchSources = () => {
    setLocalShowSearchSources(!localShowSearchSources)
  }

  // Toggle search images display
  const toggleSearchImages = () => {
    setLocalShowSearchImages(!localShowSearchImages)
  }

  // Toggle settings popup
  const toggleSettingsPopup = () => {
    setShowSettingsPopup(!showSettingsPopup)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only auto-detect language if no manual preference has been saved
    const savedLanguage = localStorage.getItem("orphion-speech-language")
    if (newValue.trim().length === 1 && !isListening && !savedLanguage) {
      const detectedLangIndex = detectLanguage(newValue)
      if (detectedLangIndex !== currentLanguageIndex) {
        setCurrentLanguageIndex(detectedLangIndex)
        // Save preference to localStorage
        localStorage.setItem("orphion-speech-language", detectedLangIndex.toString())
      }
    }
  }

  return (
    <div className="h-full w-full relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={chatStarted || isTransitioning || isStartingChat}
      />

      {/* Welcome Screen - Hidden when chat starts */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
          isTransitioning ? "opacity-0" : chatStarted ? "hidden" : "opacity-100"
        }`}
      >
        {/* Mobile menu button - only visible on mobile */}
        {isMobile && !chatStarted && (
          <button
            className="absolute top-3 left-3 p-2 rounded-md bg-neutral-800/50 text-white"
            onClick={onSidebarToggle}
          >
            <Menu size={20} />
          </button>
        )}

        {/* "What would you like to do?" speech bubble */}
        <div className="relative mb-8 p-3 bg-neutral-800 rounded-lg text-white text-lg animate-fadeIn" style={{ animationDelay: "50ms" }}>
          <span key={currentMessageIndex} className="animate-spin-up-message">
            {messages[currentMessageIndex]}
          </span>
          <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-neutral-800 -translate-x-1/2"></div>
        </div>

        {/* Logo */}
        <div className="mb-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center">
            <Image src="/images/orphion-logo.png" alt="Orphion Logo" width={60} height={60} className="h-16 w-auto" />
          </div>
        </div>

        {/* Chat Input */}
        <div className="w-full max-w-2xl">
          <div className="bg-[#0a0a0a] rounded-2xl p-3 border border-neutral-900">
            <div className="mb-3 relative">
              <Textarea
                ref={inputRef}
                className={`w-full bg-transparent border-none text-base placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none textarea-3-lines modern-scrollbar font-serif ${
                  chatStarted || isTransitioning || isStartingChat ? "opacity-50" : ""
                } ${isListening ? "border-red-500 border-2" : ""}`}
                placeholder={
                  isStartingChat
                    ? "Starting chat..."
                    : isListening
                      ? currentLanguage.placeholder
                      : attachedImage
                        ? "Describe the image or ask a question about it..."
                        : "Ask Anything..."
                }
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                autoFocus
                disabled={chatStarted || isTransitioning || isStartingChat || isListening}
                style={{ fontFamily: "var(--font-merriweather), serif" }}
              />
              {isListening && (
                <div className="absolute right-3 top-3 animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Settings button - icon only */}
                <button
                  className={`flex items-center justify-center w-8 h-8 border border-neutral-600 rounded-full hover:bg-neutral-800/50 transition-colors cursor-pointer bg-neutral-800/30 ${
                    chatStarted || isTransitioning || isStartingChat
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                  onClick={toggleSettingsPopup}
                  disabled={chatStarted || isTransitioning || isStartingChat}
                  aria-label="Preferences"
                  title="Preferences"
                >
                  <Wand2 size={16} style={{ color: "#ffffff" }} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Microphone button for voice input - removed from UI since we'll use the send button area */}
                {/* This button is now hidden as we're using the send button area for mic functionality */}

                {/* Image attachment button (using the paperclip icon) */}
                <div className="relative">
                  {attachedImage ? (
                    <div className="relative group">
                      <img
                        src={attachedImage || "/placeholder.svg"}
                        alt="Attached"
                        className="w-[30px] h-[30px] rounded-md object-cover border border-neutral-700"
                      />
                      <button
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`text-neutral-400 hover:text-white transition-colors ${
                        chatStarted || isTransitioning || isStartingChat ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={handleAttachImage}
                      disabled={chatStarted || isTransitioning || isStartingChat}
                      aria-label="Attach image"
                      title="Attach image"
                    >
                      <Paperclip size={18} className="translate-y-0.5" style={{ color: "#ffffff" }} />
                    </button>
                  )}
                </div>

                {inputValue.trim() === "" && !attachedImage ? (
                  // Show mic button when input is empty
                  <button
                    className={`p-1.5 rounded-full transition-colors ${
                      isTyping || chatStarted || isStartingChat
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-neutral-800/50"
                    }`}
                    onClick={toggleSpeechRecognition}
                    disabled={isTyping || chatStarted || isStartingChat || !recognitionSupported}
                    aria-label="Voice input"
                  >
                    <Mic size={18} style={{ color: "#ffffff" }} />
                  </button>
                ) : (
                  // Show send button when there's input
                  <button
                    className={`p-1.5 rounded-full transition-colors ${
                      isTyping || chatStarted || isStartingChat ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-800/50"
                    }`}
                    onClick={handleStartChat}
                    disabled={isTyping || chatStarted || isStartingChat}
                  >
                    <ArrowRight size={20} style={{ color: "#ffffff" }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-3 text-xs text-neutral-500 animate-fadeIn" style={{ animationDelay: "300ms" }}>
          Orphion Agent Preview
        </div>
      </div>

      {/* Settings Popup */}
      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        onModeSelect={handleModeSelect}
        selectedMode={selectedMode}
        showSearchSources={localShowSearchSources}
        showSearchImages={localShowSearchImages}
        onToggleSearchSources={toggleSearchSources}
        onToggleSearchImages={toggleSearchImages}
        currentLanguageIndex={currentLanguageIndex}
        onLanguageChange={handleLanguageChange}
      />

      {/* API Key Warning Modal */}
      <ApiKeyWarning isOpen={showApiKeyWarning} onClose={() => setShowApiKeyWarning(false)} />

      {/* Chat Interface - Only shown when chat starts */}
      {chatStarted && (
        <div className="absolute inset-0 animate-fadeIn">
          <OrphionChat
            initialMessage={initialMessage}
            onClose={handleEndChat}
            chatSession={currentChat}
            isPendingCreation={isPendingCreation}
            onChatCreated={handleChatCreated}
            selectedMode={selectedMode}
            onSidebarToggle={onSidebarToggle}
            onChatUpdated={onChatUpdated}
            showSearchSources={localShowSearchSources}
            showSearchImages={localShowSearchImages}
            initialAttachedImage={attachedImage}
          />
        </div>
      )}
    </div>
  )
}
