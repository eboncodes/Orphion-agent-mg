"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, ChevronDown, Globe, Paperclip, Sparkles, Menu, Pyramid, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import OrphionChat from "./orphion-chat"
import type { ChatSession } from "./chat-storage-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "../hooks/use-mobile"
import { getSavedSessions } from "./chat-storage-service"
import WebSearchDropdown from "./web-search-dropdown"
import { getMissingApiKeys } from "@/utils/api-keys"
import ApiKeyWarning from "./api-key-warning"

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
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return "Good Morning"
  } else if (hour >= 12 && hour < 18) {
    return "Good Afternoon"
  } else if (hour >= 18 && hour < 22) {
    return "Good Evening"
  } else {
    return "Good Night"
  }
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
  const [inputValue, setInputValue] = useState("")
  const [chatStarted, setChatStarted] = useState(false)
  const [initialMessage, setInitialMessage] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null)
  const [isPendingCreation, setIsPendingCreation] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMode, setSelectedMode] = useState("General")
  const isMobile = useIsMobile()
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [showWebSearchDropdown, setShowWebSearchDropdown] = useState(false)
  const [localShowSearchSources, setLocalShowSearchSources] = useState(showSearchSources)
  const [localShowSearchImages, setLocalShowSearchImages] = useState(showSearchImages)
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [greeting, setGreeting] = useState(getTimeBasedGreeting())

  // Update greeting every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setGreeting(getTimeBasedGreeting())
    }, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [])

  // Function to get the icon based on selected mode
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Deep Search":
        return <Pyramid size={16} className="mr-2" />
      default:
        return <Sparkles size={16} className="mr-2" />
    }
  }

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
  }

  // Toggle web search dropdown
  const toggleWebSearchDropdown = () => {
    setShowWebSearchDropdown(!showWebSearchDropdown)
  }

  // Toggle search sources display
  const toggleSearchSources = () => {
    setLocalShowSearchSources(!localShowSearchSources)
  }

  // Toggle search images display
  const toggleSearchImages = () => {
    setLocalShowSearchImages(!localShowSearchImages)
  }

  // Get username from user object
  const username = "there"

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

        {/* Logo */}
        <div className="mb-4 animate-fadeIn">
          <Image src="/images/orphion-logo.png" alt="Orphion Logo" width={60} height={60} className="h-16 w-auto" />
        </div>

        {/* Heading - Updated with time-based greeting */}
        <h1 className="text-4xl mb-2 tracking-wide animate-fadeIn font-bold" style={{ animationDelay: "100ms" }}>
          {greeting}, {username}
        </h1>
        <p className="text-lg mb-6 tracking-wide animate-fadeIn text-neutral-400" style={{ animationDelay: "150ms" }}>
          How can I help you?
        </p>

        {/* Chat Input */}
        <div className={`w-full ${isMobile ? "px-4" : "max-w-lg"} animate-fadeIn`} style={{ animationDelay: "200ms" }}>
          <div className="bg-[#0a0a0a] rounded-2xl p-3 border border-neutral-900">
            <div className="mb-3">
              <Textarea
                ref={inputRef}
                className={`w-full bg-transparent border-none text-base placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none textarea-3-lines modern-scrollbar font-serif ${
                  chatStarted || isTransitioning || isStartingChat ? "opacity-50" : ""
                }`}
                placeholder={
                  isStartingChat
                    ? "Starting chat..."
                    : attachedImage
                      ? "Describe the image or ask a question about it..."
                      : "Ask Anything..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                autoFocus
                disabled={chatStarted || isTransitioning || isStartingChat}
                style={{ fontFamily: "var(--font-merriweather), serif" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      disabled={chatStarted || isTransitioning || isStartingChat || !!attachedImage}
                    >
                      <div
                        className={`flex items-center border border-neutral-600 rounded-full px-2 py-1 hover:bg-neutral-800/50 transition-colors cursor-pointer bg-neutral-800/30 ${
                          chatStarted || isTransitioning || isStartingChat || !!attachedImage
                            ? "opacity-50 cursor-not-allowed pointer-events-none"
                            : ""
                        }`}
                      >
                        {getModeIcon(selectedMode)}
                        {!isMobile && <span className="text-xs text-white">{selectedMode}</span>}
                        <ChevronDown size={14} className="ml-1 text-white" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-neutral-800 text-white">
                      <DropdownMenuItem
                        className="hover:bg-red-800 focus:bg-red-800 cursor-pointer flex items-center text-white"
                        onClick={() => handleModeSelect("General")}
                      >
                        <Sparkles size={16} className="mr-2" />
                        General
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hover:bg-red-800 focus:bg-red-800 cursor-pointer flex items-center text-white"
                        onClick={() => handleModeSelect("Deep Search")}
                      >
                        <Pyramid size={16} className="mr-2" />
                        Deep Search
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Web search button - more compact on mobile */}
                <div className="relative flex items-center">
                  <div
                    className={`flex items-center border border-neutral-600 rounded-full px-2 py-1 hover:bg-neutral-800/50 transition-colors cursor-pointer bg-neutral-800/30 ${
                      chatStarted || isTransitioning || isStartingChat || !!attachedImage
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                    onClick={toggleWebSearchDropdown}
                  >
                    <Globe size={18} className="text-white" />
                    {!isMobile && <span className="ml-2 text-xs text-white">Search Option</span>}
                  </div>

                  <WebSearchDropdown
                    isOpen={
                      showWebSearchDropdown && !chatStarted && !isTransitioning && !isStartingChat && !attachedImage
                    }
                    onClose={() => setShowWebSearchDropdown(false)}
                    showSources={localShowSearchSources}
                    showImages={localShowSearchImages}
                    onToggleSources={toggleSearchSources}
                    onToggleImages={toggleSearchImages}
                  />
                </div>

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
                      <Paperclip size={18} className="translate-y-0.5" />
                    </button>
                  )}
                </div>

                <button
                  className={`bg-red-700 hover:bg-red-600 p-1.5 rounded-full transition-colors ${
                    (!inputValue.trim() && !attachedImage) || isTyping || chatStarted || isStartingChat
                      ? "opacity-50 cursor-not-allowed bg-neutral-700"
                      : ""
                  }`}
                  onClick={handleStartChat}
                  disabled={(!inputValue.trim() && !attachedImage) || isTyping || chatStarted || isStartingChat}
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-3 text-xs text-neutral-500 animate-fadeIn" style={{ animationDelay: "300ms" }}>
          Orphion Agent Preview
        </div>
      </div>

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
