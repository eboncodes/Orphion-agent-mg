"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Trash,
  X,
  Sparkles,
  Archive,
  Menu,
  ChevronLeft,
  ChevronRight,
  Pyramid,
  ImageIcon,
  Globe,
  ArrowUp,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  type ChatSession,
  type Message,
  type MessageVersion,
  addMessage,
  deleteSessionById,
  createChatSession,
  getSavedSessions,
  generateAndUpdateTitle,
  updateMessage,
} from "./chat-storage-service"
import TextGenerationLoader from "./text-generation-loader"
import ReasoningDisplay from "./reasoning-display"
import TypingAnimation from "./typing-animation"
import MessageActions from "./message-actions"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "../hooks/use-mobile"
import { generateAIResponse } from "./ai-service"
import FormattedText from "./formatted-text"
import { performWebSearch, summarizeWebSearchResults, type TavilyImage } from "./web-search-service"
import WebSearchResults from "./web-search-results"
import SearchProgress from "./search-progress"
import { checkApiKeysExist, getMissingApiKeys } from "@/utils/api-keys"
import { analyzeImageWithVision, explainVisionResults } from "./vision-service"
import ApiKeyWarning from "./api-key-warning"
import ImageViewer from "./image-viewer"
import WebSearchDropdown from "./web-search-dropdown"
import DeleteConfirmation from "./delete-confirmation"
import CanvasPanel from "./canvas-panel"

interface OrphionChatProps {
  initialMessage?: string
  onClose: () => void
  chatSession: ChatSession | null
  isPendingCreation?: boolean
  onChatCreated?: (chat: ChatSession) => void
  onChatUpdated?: (chat: ChatSession) => void
  selectedMode?: string
  onSidebarToggle?: () => void
  showSearchSources?: boolean
  showSearchImages?: boolean
  initialAttachedImage?: string | null
}

export default function OrphionChat({
  initialMessage = "",
  onClose,
  chatSession,
  isPendingCreation = false,
  onChatCreated,
  onChatUpdated,
  selectedMode = "General",
  onSidebarToggle,
  showSearchSources = false,
  showSearchImages = true,
  initialAttachedImage = null,
}: OrphionChatProps) {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>(chatSession?.messages || [])
  const [isTyping, setIsTyping] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [session, setSession] = useState<ChatSession | null>(chatSession)
  const [currentMode, setCurrentMode] = useState(selectedMode)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = useIsMobile()
  const [isProcessingInitialMessage, setIsProcessingInitialMessage] = useState(false)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [completedMessageIds, setCompletedMessageIds] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<TavilyImage | null>(null)

  // New state for API key warning
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false)

  // New state for web search dropdown
  const [showWebSearchDropdown, setShowWebSearchDropdown] = useState(false)
  const [localShowSearchSources, setLocalShowSearchSources] = useState(showSearchSources)
  const [localShowSearchImages, setLocalShowSearchImages] = useState(showSearchImages)

  // Inside the OrphionChat component, add these new state variables
  const [searchQueries, setSearchQueries] = useState<string[]>([])
  const [completedSearchQueries, setCompletedSearchQueries] = useState<string[]>([])
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isWebSearch, setIsWebSearch] = useState(false)

  // Add this state at the top with other state declarations
  const [showScrollButton, setShowScrollButton] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Add state for image attachment
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [isVisionQuery, setIsVisionQuery] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add this state to track if initial image was already processed
  const [initialImageProcessed, setInitialImageProcessed] = useState(false)

  // Add a new state variable for Monaco editor toggle
  const [useMonacoEditor, setUseMonacoEditor] = useState(true)

  // Add state for canvas panel
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [canvasContent, setCanvasContent] = useState("")
  const [canvasMessageId, setCanvasMessageId] = useState<string | null>(null)

  // Function to get the icon based on selected mode
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Deep Search":
        return <Pyramid size={16} className="mr-2" />
      default:
        return <Sparkles size={16} className="mr-2" />
    }
  }

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
    if (isTyping || isPendingCreation) return
    fileInputRef.current?.click()
  }

  // Handlers for versioning, image clicks, typing complete, and message regeneration
  const handlePreviousVersion = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (
          msg.id === messageId &&
          msg.versions &&
          msg.currentVersionIndex !== undefined &&
          msg.currentVersionIndex > 0
        ) {
          return { ...msg, currentVersionIndex: msg.currentVersionIndex - 1 }
        }
        return msg
      }),
    )
  }

  const handleNextVersion = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (
          msg.id === messageId &&
          msg.versions &&
          msg.currentVersionIndex !== undefined &&
          msg.currentVersionIndex < msg.versions.length - 1
        ) {
          return { ...msg, currentVersionIndex: msg.currentVersionIndex + 1 }
        }
        return msg
      }),
    )
  }

  const handleImageClick = (image: TavilyImage) => {
    setSelectedImage(image)
  }

  // Function to handle auto-scrolling when content changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollButton(false)
  }

  const handleTypingComplete = (messageId: string) => {
    setCompletedMessageIds((prev) => new Set(prev).add(messageId))
    scrollToBottom() // Scroll to bottom when typing completes
  }

  const handleRegenerateMessage = async (messageId: string) => {
    // Check if API keys exist
    if (!checkApiKeysExist()) {
      setShowApiKeyWarning(true)
      return
    }

    setRegeneratingMessageId(messageId)

    // Find the message to regenerate
    const messageToRegenerate = messages.find((msg) => msg.id === messageId)

    if (messageToRegenerate) {
      // Extract the user's prompt that led to this message
      const userMessageIndex = messages.findIndex((msg) => msg.id === messageToRegenerate.id) - 1

      if (userMessageIndex >= 0) {
        const userMessage = messages[userMessageIndex]

        // Ensure we have a session and a user message
        if (session && userMessage) {
          // Optimistically update the UI
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if (msg.id === messageId) {
                return { ...msg, content: "", isTyping: true }
              }
              return msg
            }),
          )

          // Process the user message again to regenerate the AI response
          await processUserMessage(userMessage.content, session, messages)
        }
      }
    }

    setRegeneratingMessageId(null)
  }

  // Function to open canvas with message content
  const handleOpenCanvas = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId)
    if (message) {
      setCanvasContent(message.content)
      setCanvasMessageId(messageId)
      setIsCanvasOpen(true)

      // Close sidebar if it's open (via the parent component)
      if (onSidebarToggle) {
        onSidebarToggle()
      }
    }
  }

  // Function to save edited content from canvas
  const handleSaveCanvas = (content: string) => {
    if (!canvasMessageId || !session) return

    // Update the message in state
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === canvasMessageId) {
          return { ...msg, content }
        }
        return msg
      }),
    )

    // Update the message in storage
    if (session) {
      const updatedSession = updateMessage(session, canvasMessageId, { content })
      setSession(updatedSession)

      // Notify parent that chat has been updated
      if (onChatUpdated) {
        onChatUpdated(updatedSession)
      }
    }
  }

  // Process image with vision model
  const processImageWithVision = async (
    imageData: string,
    userPrompt: string,
    currentSession: ChatSession,
    currentMessages: Message[],
  ) => {
    try {
      setIsVisionQuery(true)
      setIsTyping(true)

      // First, analyze the image with the vision model
      const visionResult = await analyzeImageWithVision(imageData, userPrompt)

      if (visionResult.error) {
        throw new Error(visionResult.error)
      }

      // Then, get a detailed explanation from deepseek
      const detailedExplanation = await explainVisionResults(visionResult.description, userPrompt)

      // Calculate generation time
      const generationTime = Math.round(10) // Placeholder value

      // Create initial version
      const initialVersion: MessageVersion = {
        content: detailedExplanation,
        generationTime: generationTime,
        timestamp: new Date(),
      }

      // Add AI message with the explanation
      const sessionWithAI = addMessage(currentSession, detailedExplanation, "ai", {
        generationTime,
        versions: [initialVersion],
        currentVersionIndex: 0,
        visionMetadata: {
          isVisionQuery: true,
          originalVisionDescription: visionResult.description,
          imageData: imageData,
        },
      })

      // Get the AI message we just added
      const aiMessage = sessionWithAI.messages[sessionWithAI.messages.length - 1]

      setSession(sessionWithAI)
      setMessages([...currentMessages, { ...aiMessage, isTyping: true }])

      // Check if we need to generate a title
      if (sessionWithAI.messages.length === 2 && !sessionWithAI.titleGenerated) {
        generateAndUpdateTitle(sessionWithAI)
          .then((sessionWithTitle) => {
            setSession(sessionWithTitle)
            if (onChatUpdated) {
              onChatUpdated(sessionWithTitle)
            }
          })
          .catch((error) => {
            console.error("Error generating title:", error)
          })
      }

      // Notify parent that chat has been created or updated
      if (isPendingCreation && onChatCreated) {
        onChatCreated(sessionWithAI)
        setIsProcessingInitialMessage(false)
      } else if (onChatUpdated) {
        onChatUpdated(sessionWithAI)
      }

      return sessionWithAI
    } catch (error) {
      console.error("Error processing image with vision:", error)

      // Add a generic error message
      const errorResponse = `I'm sorry, I encountered an error while analyzing the image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`

      const updatedSessionWithError = addMessage(currentSession, errorResponse, "ai")

      setSession(updatedSessionWithError)
      setMessages([
        ...currentMessages,
        {
          id: Date.now().toString(),
          content: errorResponse,
          sender: "ai",
          timestamp: new Date(),
        },
      ])

      if (isPendingCreation) {
        setIsProcessingInitialMessage(false)
      }

      return currentSession
    } finally {
      setIsTyping(false)
      setIsVisionQuery(false)
      setAttachedImage(null) // Clear the image after processing
    }
  }

  // Process user message with AI and handle web search if needed
  const processUserMessage = async (userPrompt: string, currentSession: ChatSession, currentMessages: Message[]) => {
    try {
      // Check if API keys exist
      if (!checkApiKeysExist()) {
        setShowApiKeyWarning(true)
        setIsTyping(false)
        return null
      }

      // Get the most recent message (which should be the user message)
      const currentUserMessage = currentMessages[currentMessages.length - 1]
      const hasAttachedImage = currentUserMessage?.hasAttachedImage || false

      // Only process image if this specific message has an image attached
      if (hasAttachedImage) {
        // Determine which image to use
        const imageToProcess = currentUserMessage.imageData || attachedImage || initialAttachedImage

        if (imageToProcess) {
          return processImageWithVision(imageToProcess, userPrompt, currentSession, currentMessages)
        }
      }

      // Reset search states
      setSearchQueries([])
      setCompletedSearchQueries([])
      setIsSummarizing(false)
      setIsWebSearch(false)

      // Extract previous messages for context
      const conversationHistory = currentSession.messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }))

      // Record start time for generation timing
      const startTime = Date.now()

      // First, get AI response to determine if web search is needed
      const aiResponse = await generateAIResponse(userPrompt, conversationHistory)

      let response, reasoning, webSearchMetadata
      const finalSearchQueries: string[] = []

      // Check if web search is needed based on AI's decision (web search is always enabled)
      if (aiResponse.needsWebSearch && aiResponse.searchQuery) {
        console.log("AI determined web search is needed with query:", aiResponse.searchQuery)
        setIsWebSearch(true)

        try {
          // Define the search progress callback
          const handleSearchProgress = (query: string, completed: boolean) => {
            // If this is a new query, add it to the list
            if (!searchQueries.includes(query)) {
              setSearchQueries((prev) => [...prev, query])
              finalSearchQueries.push(query)
            }

            // If the query is completed, add it to the completed list
            if (completed) {
              setCompletedSearchQueries((prev) => {
                // Only add if not already in the list
                if (!prev.includes(query)) {
                  return [...prev, query]
                }
                return prev
              })
            }
          }

          // Perform web search with the refined query from AI and current mode
          const searchResults = await performWebSearch(aiResponse.searchQuery, currentMode, handleSearchProgress)

          // Set summarizing state - use "analyzing" for Deep Search mode
          setIsSummarizing(true)

          // Summarize the search results
          const summarizedAnswer = await summarizeWebSearchResults(aiResponse.searchQuery, searchResults, currentMode)

          // Reset summarizing state
          setIsSummarizing(false)

          // Create web search metadata
          webSearchMetadata = {
            isWebSearch: true,
            searchResults: searchResults.results,
            images: searchResults.images,
            originalAnswer: searchResults.answer,
            showSources: localShowSearchSources,
            showImages: localShowSearchImages,
            searchQuery: aiResponse.searchQuery,
            searchQueries: finalSearchQueries, // Use the final list of search queries
            reasoning_format: "hidden",
            searchMode: currentMode,
          }

          response = summarizedAnswer
          reasoning = null // Remove reasoning for web search results
        } catch (error) {
          console.error("Web search failed:", error)
          // Fall back to regular AI response
          const fallbackResponse = await generateAIResponse(userPrompt, conversationHistory)
          response = fallbackResponse.response
          reasoning = fallbackResponse.reasoning
          webSearchMetadata = { isWebSearch: false }
          setIsWebSearch(false)
        }
      } else {
        // No web search needed, use the AI response directly
        response = aiResponse.response
        reasoning = aiResponse.reasoning
        webSearchMetadata = { isWebSearch: false }
        setIsWebSearch(false)
      }

      // Calculate generation time in seconds
      const generationTime = Math.round((Date.now() - startTime) / 1000)

      // Create initial version
      const initialVersion: MessageVersion = {
        content: response,
        reasoning: reasoning,
        generationTime: generationTime,
        timestamp: new Date(),
      }

      // Add AI message with reasoning, typing flag, and version tracking
      const sessionWithAI = addMessage(currentSession, response, "ai", {
        reasoning,
        generationTime,
        versions: [initialVersion],
        currentVersionIndex: 0,
        webSearchMetadata,
      })

      // Get the AI message we just added
      const aiMessage = sessionWithAI.messages[sessionWithAI.messages.length - 1]

      setSession(sessionWithAI)
      setMessages([...currentMessages, { ...aiMessage, isTyping: true }])

      // Check if we need to generate a title
      if (sessionWithAI.messages.length === 2 && !sessionWithAI.titleGenerated) {
        // Generate title in the background
        generateAndUpdateTitle(sessionWithAI)
          .then((sessionWithTitle) => {
            // Update the session with the new title
            setSession(sessionWithTitle)

            // Notify parent that chat has been updated with a title
            if (onChatUpdated) {
              onChatUpdated(sessionWithTitle)
            }
          })
          .catch((error) => {
            console.error("Error generating title:", error)
          })
      }

      // Notify parent that chat has been created or updated
      if (isPendingCreation && onChatCreated) {
        console.log("Notifying parent of chat creation")
        onChatCreated(sessionWithAI)
        setIsProcessingInitialMessage(false)
      } else if (onChatUpdated) {
        onChatUpdated(sessionWithAI)
      }

      return sessionWithAI
    } catch (error) {
      console.error("Error processing user message:", error)

      // Check if the error is related to API keys
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (
        errorMessage.includes("API Key") ||
        errorMessage.includes("API key") ||
        errorMessage.includes("Authorization")
      ) {
        // Show the API key warning
        setShowApiKeyWarning(true)

        // Add a generic error message
        const errorResponse = "I'm sorry, there was an issue with the API keys. Please check your API settings."
        const updatedSessionWithError = addMessage(currentSession, errorResponse, "ai")

        setSession(updatedSessionWithError)
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            content: errorResponse,
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      } else {
        // Handle other errors with a generic message
        const errorResponse = "I'm sorry, I encountered an error while generating a response. Please try again."
        const updatedSessionWithError = addMessage(currentSession, errorResponse, "ai")

        setSession(updatedSessionWithError)
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            content: errorResponse,
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      }

      if (isPendingCreation) {
        setIsProcessingInitialMessage(false)
      }

      return currentSession
    } finally {
      setIsTyping(false)
      // Reset search states when done
      setSearchQueries([])
      setCompletedSearchQueries([])
      setIsSummarizing(false)
      // Clear the attached image after processing
      setAttachedImage(null)
    }
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if ((inputValue.trim() === "" && !attachedImage) || !session || isTyping) return

    // Check if both API keys exist
    const { groq: missingGroq, tavily: missingTavily } = getMissingApiKeys()

    if (missingGroq || missingTavily) {
      setShowApiKeyWarning(true)
      return
    }

    // Use default prompt if only image is attached with no text
    const messageContent = inputValue.trim() || (attachedImage ? "What's in this image?" : "")

    // Add user message to session
    const updatedSession = addMessage(session, messageContent, "user", {
      hasAttachedImage: !!attachedImage,
      imageData: attachedImage || undefined,
    })
    setSession(updatedSession)

    // Update messages with user message
    const updatedMessages = [
      ...messages,
      {
        id: Date.now().toString(),
        content: messageContent,
        sender: "user",
        timestamp: new Date(),
        hasAttachedImage: !!attachedImage,
        imageData: attachedImage || undefined,
      },
    ]
    setMessages(updatedMessages)

    setInputValue("")
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "40px"
    }

    // Process the user message
    await processUserMessage(messageContent, updatedSession, updatedMessages)
  }

  // Update mode when prop changes
  useEffect(() => {
    setCurrentMode(selectedMode)
  }, [selectedMode])

  // Update search preferences when props change
  useEffect(() => {
    setLocalShowSearchSources(showSearchSources)
  }, [showSearchSources])

  useEffect(() => {
    setLocalShowSearchImages(showSearchImages)
  }, [showSearchImages])

  // Set initial attached image if provided
  useEffect(() => {
    if (initialAttachedImage) {
      setAttachedImage(initialAttachedImage)
    }
  }, [initialAttachedImage])

  // Check for updates to the current session
  useEffect(() => {
    if (session) {
      // Set up an interval to check for updates to the current session
      const intervalId = setInterval(() => {
        const chats = getSavedSessions()
        const updatedSession = chats.find((chat) => chat.id === session.id)

        if (updatedSession && updatedSession.messages.length !== session.messages.length) {
          console.log("Session has been updated in storage, refreshing:", updatedSession.id)

          // Update the session and messages
          setSession(updatedSession)

          // Process messages to mark AI messages as completed
          const processedMessages = updatedSession.messages.map((msg) => {
            if (msg.sender === "ai") {
              // Add to completed message IDs
              setCompletedMessageIds((prev) => new Set(prev).add(msg.id))
              // Mark as not typing
              return { ...msg, isTyping: false }
            }
            return msg
          })

          setMessages(processedMessages)

          // Notify parent that chat has been updated
          if (onChatUpdated) {
            onChatUpdated(updatedSession)
          }
        }
      }, 2000) // Check every 2 seconds

      return () => clearInterval(intervalId)
    }
  }, [session, onChatUpdated])

  // Initialize with the initial message if provided and no existing messages
  useEffect(() => {
    // Only process if we have an initial message, are pending creation, and aren't already processing
    if ((initialMessage || initialAttachedImage) && isPendingCreation && !isProcessingInitialMessage && !session) {
      // Check if both API keys exist
      const { groq: missingGroq, tavily: missingTavily } = getMissingApiKeys()

      if (missingGroq || missingTavily) {
        setShowApiKeyWarning(true)
        return
      }

      // Set flag to prevent multiple processing
      setIsProcessingInitialMessage(true)

      // Use default prompt if only image is attached with no text
      const messageContent = initialMessage.trim() || (initialAttachedImage ? "What's in this image?" : "")

      console.log("Processing initial message:", messageContent, "with image:", !!initialAttachedImage)

      // Create a temporary user message for display
      const tempUserMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        sender: "user",
        timestamp: new Date(),
        hasAttachedImage: !!initialAttachedImage,
        imageData: initialAttachedImage || undefined,
      }

      setMessages([tempUserMessage])
      setIsTyping(true)

      // Create a new chat session
      const newSession = createChatSession()

      // Add the user message to the new session
      const sessionWithUserMsg = addMessage(newSession, messageContent, "user", {
        hasAttachedImage: !!initialAttachedImage,
        imageData: initialAttachedImage || undefined,
      })

      // Set the session immediately to prevent duplicate processing
      setSession(sessionWithUserMsg)

      // Process the user message
      processUserMessage(messageContent, sessionWithUserMsg, [tempUserMessage])

      // Mark that we've processed the initial image
      if (initialAttachedImage) {
        setInitialImageProcessed(true)
      }
    }
  }, [initialMessage, initialAttachedImage, isPendingCreation, isProcessingInitialMessage, session, onChatCreated])

  // Update messages when session changes
  useEffect(() => {
    if (chatSession && !isPendingCreation) {
      console.log("Updating session from props:", chatSession.id)
      setSession(chatSession)

      // Mark all AI messages as completed to prevent typing animation
      const processedMessages = chatSession.messages.map((msg) => {
        if (msg.sender === "ai") {
          // Add to completed message IDs
          setCompletedMessageIds((prev) => new Set(prev).add(msg.id))
          // Mark as not typing
          return { ...msg, isTyping: false }
        }
        return msg
      })

      setMessages(processedMessages)
    }
  }, [chatSession, isPendingCreation])

  // Scroll to bottom when new messages are added or when typing status changes
  useEffect(() => {
    // Only scroll if there are messages
    if (messages.length > 0) {
      // Scroll to the latest message with a smooth animation
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  // Add a separate effect to handle initial scroll and when a message completes typing
  useEffect(() => {
    // This will ensure we scroll when a message finishes typing
    if (completedMessageIds.size > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [completedMessageIds.size])

  // Focus input when component mounts or when typing finishes
  useEffect(() => {
    if (!isTyping && !isPendingCreation) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isTyping, isPendingCreation])

  // Add an effect for auto-resizing the textarea
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

  // Add this useEffect to handle scroll detection
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // Show button when user scrolls up more than 300px from bottom
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 300
      setShowScrollButton(isScrolledUp)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
    // Shift+Enter will naturally create a new line
  }

  const handleDeleteChat = () => {
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteChat = () => {
    setShowDeleteConfirmation(false)
    // Delete from local storage if we have a session
    if (session) {
      deleteSessionById(session.id)
    }
    // Close chat
    onClose()
  }

  const handleModeSelect = (mode: string) => {
    setCurrentMode(mode)
  }

  // Toggle web search dropdown
  const toggleWebSearchDropdown = () => {
    setShowWebSearchDropdown(!showWebSearchDropdown)
  }

  // Toggle search sources display
  const toggleSearchSources = () => {
    setLocalShowSearchSources(!localShowSearchSources)

    // Update existing messages with web search metadata
    if (session) {
      const updatedMessages = messages.map((msg) => {
        if (msg.sender === "ai" && msg.webSearchMetadata?.isWebSearch) {
          return {
            ...msg,
            webSearchMetadata: {
              ...msg.webSearchMetadata,
              showSources: !localShowSearchSources,
            },
          }
        }
        return msg
      })

      setMessages(updatedMessages)
    }
  }

  // Toggle search images display
  const toggleSearchImages = () => {
    setLocalShowSearchImages(!localShowSearchImages)

    // Update existing messages with web search metadata
    if (session) {
      const updatedMessages = messages.map((msg) => {
        if (msg.sender === "ai" && msg.webSearchMetadata?.isWebSearch) {
          return {
            ...msg,
            webSearchMetadata: {
              ...msg.webSearchMetadata,
              showImages: !localShowSearchImages,
            },
          }
        }
        return msg
      })

      setMessages(updatedMessages)
    }
  }

  // Add this function to handle editor toggle
  const handleToggleEditor = () => {
    setUseMonacoEditor(!useMonacoEditor)
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isTyping || isPendingCreation}
      />

      {/* Chat Header - Updated with centered title and archive format, with user profile */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        {isMobile ? (
          <div className="w-20 flex items-center">
            <button
              className="text-neutral-400 hover:text-white transition-colors p-1"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          </div>
        ) : (
          <div className="w-20 flex items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-neutral-800 text-white text-xs">EB</AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="flex items-center justify-center">
          <Archive size={16} className="text-neutral-400 mr-1" />
          <span className="text-white text-sm font-medium">
            Archive/<span className="text-neutral-300">{session?.title || "New Chat"}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 w-20 justify-end">
          <button
            className="text-neutral-400 hover:text-white transition-colors p-1"
            onClick={handleDeleteChat}
            aria-label="Delete chat"
          >
            <Trash size={16} />
          </button>
          <button
            className="text-neutral-400 hover:text-white transition-colors p-1"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Messages - Hide scrollbar */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
            <div className="mb-4">
              <Image src="/images/orphion-logo.png" alt="Orphion Logo" width={60} height={60} className="h-16 w-auto" />
            </div>
            <div className="flex items-center mb-2">
              <Image src="/images/orphion-full-dark.png" alt="Orphion" width={120} height={40} className="h-8 w-auto" />
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${isMobile ? (message.sender === "user" ? "justify-end" : "justify-start") : "justify-center"} animate-messageSlideIn`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  opacity: completedMessageIds.has(message.id) || message.sender === "user" ? 1 : 0.7,
                }}
              >
                {message.sender === "ai" && (
                  <div className={`flex flex-col ${isMobile ? "max-w-[90%]" : "max-w-[80%] w-[80%]"}`}>
                    {/* AI avatar and name at the top */}
                    <div className="flex items-center mb-3">
                      <div className="mr-2">
                        <Image
                          src="/images/orphion-logo.png"
                          alt="Orphion Logo"
                          width={20}
                          height={20}
                          className="h-5 w-auto"
                        />
                      </div>
                      <span className="text-white text-sm font-medium">Orphion</span>

                      {/* Version indicator */}
                      {message.versions && message.versions.length > 1 && (
                        <div className="ml-auto flex items-center gap-1 text-xs text-neutral-400">
                          <button
                            onClick={() => handlePreviousVersion(message.id)}
                            disabled={message.currentVersionIndex === 0}
                            className={`p-1 rounded-md hover:bg-neutral-800 transition-colors ${
                              message.currentVersionIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            aria-label="Previous version"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span>
                            {(message.currentVersionIndex || 0) + 1}/{message.versions.length}
                          </span>
                          <button
                            onClick={() => handleNextVersion(message.id)}
                            disabled={message.currentVersionIndex === message.versions.length - 1}
                            className={`p-1 rounded-md hover:bg-neutral-800 transition-colors ${
                              message.currentVersionIndex === message.versions.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            aria-label="Next version"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Display the analyzed image if this was a vision query */}
                    {message.visionMetadata?.isVisionQuery && message.visionMetadata.imageData && (
                      <div className="mb-4">
                        <div
                          className="relative w-full max-w-xs rounded-md overflow-hidden cursor-pointer"
                          onClick={() =>
                            setSelectedImage({ url: message.visionMetadata.imageData, title: "Analyzed image" })
                          }
                        >
                          <img
                            src={message.visionMetadata.imageData || "/placeholder.svg"}
                            alt="Analyzed image"
                            className="w-full object-contain rounded-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Web search images if available */}
                    {message.webSearchMetadata?.isWebSearch &&
                      message.webSearchMetadata.images &&
                      message.webSearchMetadata.images.length > 0 &&
                      message.webSearchMetadata.showImages !== false && (
                        <div className="mb-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {message.webSearchMetadata.images.slice(0, 6).map((image, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-video rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(image)}
                              >
                                <img
                                  src={image.url || "/placeholder.svg"}
                                  alt={image.title || "Search result"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"
                                  }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                                  <p className="text-xs text-white truncate">{image.title}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Web search sources if available - moved here to display right after images */}
                    {message.webSearchMetadata?.isWebSearch &&
                      message.webSearchMetadata.searchResults &&
                      message.webSearchMetadata.searchResults.length > 0 &&
                      message.webSearchMetadata.showSources !== false && (
                        <WebSearchResults searchResults={message.webSearchMetadata.searchResults} />
                      )}

                    {/* Reasoning display in the middle */}
                    {message.reasoning &&
                      !(
                        message.webSearchMetadata?.isWebSearch ||
                        message.webSearchMetadata?.reasoning_format === "hidden"
                      ) && (
                        <ReasoningDisplay reasoning={message.reasoning} reasoningTime={message.generationTime || 10} />
                      )}

                    {/* AI message content at the bottom with typing animation */}
                    <div className="text-neutral-200 text-sm leading-relaxed">
                      {message.isTyping && !completedMessageIds.has(message.id) ? (
                        <TypingAnimation
                          text={message.content}
                          typingSpeed={1}
                          onComplete={() => handleTypingComplete(message.id)}
                        />
                      ) : (
                        <FormattedText text={message.content || ""} useMonaco={useMonacoEditor} />
                      )}
                    </div>

                    {/* Message actions */}
                    {(!message.isTyping || completedMessageIds.has(message.id)) && (
                      <MessageActions
                        messageContent={message.content || ""}
                        onRegenerate={() => handleRegenerateMessage(message.id)}
                        onOpenCanvas={() => handleOpenCanvas(message.id)}
                        onToggleEditor={() => setUseMonacoEditor(!useMonacoEditor)}
                        isMonacoEnabled={useMonacoEditor}
                        className={regeneratingMessageId === message.id ? "opacity-50 pointer-events-none" : ""}
                        isWebSearch={!!message.webSearchMetadata?.isWebSearch}
                      />
                    )}
                  </div>
                )}

                {message.sender === "user" && (
                  <div className={`flex flex-col ${isMobile ? "w-full" : "max-w-[80%] w-[80%]"}`}>
                    <div className="bg-red-800 text-white px-4 py-2 rounded-lg self-end max-w-[90%] text-sm whitespace-pre-wrap break-words">
                      {message.hasAttachedImage && (
                        <div className="flex items-center gap-1 mb-1 text-xs">
                          <ImageIcon size={14} />
                          <span>Attached Image</span>
                        </div>
                      )}
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Show typing indicator with loading animation */}
            {isTyping && (
              <div className={`flex ${isMobile ? "justify-start" : "justify-center"} animate-fadeIn`}>
                <div className={isMobile ? "max-w-[90%]" : "max-w-[80%] w-[80%]"}>
                  <div className="flex items-center mb-3">
                    <div className="mr-2">
                      <Image
                        src="/images/orphion-logo.png"
                        alt="Orphion Logo"
                        width={20}
                        height={20}
                        className="h-5 w-auto"
                      />
                    </div>
                    <span className="text-white text-sm font-medium">Orphion</span>
                  </div>

                  {/* Always show the "Orphion is working" text */}
                  <div className="mb-4">
                    <TextGenerationLoader
                      mode={
                        isVisionQuery
                          ? "analyzing image"
                          : isSummarizing
                            ? currentMode === "Deep Search"
                              ? "analyzing"
                              : "summarizing"
                            : "working"
                      }
                    />
                    {searchQueries.length > 0 && (
                      <SearchProgress queries={searchQueries} completedQueries={completedSearchQueries} />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 bg-red-700 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all z-10"
            aria-label="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Chat Input */}
      <div className="flex justify-center pb-5 px-4">
        <div className="bg-[#1a1a1a] rounded-full flex items-center w-full max-w-[800px] py-1">
          <Textarea
            ref={inputRef}
            className={`w-full bg-transparent border-none text-base placeholder:text-neutral-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 resize-none textarea-3-lines modern-scrollbar ${isTyping ? "opacity-50" : ""}`}
            placeholder={
              isTyping
                ? "Waiting for response..."
                : attachedImage
                  ? "Describe the image or ask a question about it..."
                  : "Ask follow-up"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isPendingCreation}
            autoFocus
          />

          <div className="flex items-center pr-4 gap-2 shrink-0">
            <div className="relative flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isTyping || isPendingCreation || !!attachedImage}>
                  <div
                    className={`flex items-center border border-neutral-600 rounded-full px-2 py-1 hover:bg-neutral-800/50 transition-colors cursor-pointer bg-neutral-800/30 ${
                      isTyping || isPendingCreation || !!attachedImage
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    {getModeIcon(currentMode)}
                    {!isMobile && <span className="text-xs text-white">{currentMode}</span>}
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

            {/* Web search options button */}
            <div className="relative">
              <button
                onClick={toggleWebSearchDropdown}
                className={`text-neutral-400 hover:text-white transition-colors ${
                  isTyping || isPendingCreation ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isTyping || isPendingCreation}
              >
                <Globe size={18} />
              </button>

              <WebSearchDropdown
                isOpen={showWebSearchDropdown && !isTyping && !isPendingCreation}
                onClose={() => setShowWebSearchDropdown(false)}
                showSources={localShowSearchSources}
                showImages={localShowSearchImages}
                onToggleSources={toggleSearchSources}
                onToggleImages={toggleSearchImages}
              />
            </div>

            {/* Image attachment button */}
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
                  onClick={handleAttachImage}
                  className={`text-neutral-400 hover:text-white transition-colors ${
                    isTyping || isPendingCreation ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isTyping || isPendingCreation}
                  aria-label="Attach image"
                >
                  <ImageIcon size={18} />
                </button>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              className={`bg-red-700 hover:bg-red-600 p-2 rounded-full transition-colors ${
                (inputValue.trim() === "" && !attachedImage) || isTyping || isPendingCreation
                  ? "opacity-50 cursor-not-allowed bg-neutral-700"
                  : ""
              }`}
              disabled={(inputValue.trim() === "" && !attachedImage) || isTyping || isPendingCreation}
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteChat}
      />

      {/* API Key warning modal */}
      <ApiKeyWarning isOpen={showApiKeyWarning} onClose={() => setShowApiKeyWarning(false)} />

      {/* Image viewer modal */}
      {selectedImage && <ImageViewer image={selectedImage} onClose={() => setSelectedImage(null)} />}

      {/* Canvas panel */}
      <CanvasPanel
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        content={canvasContent}
        onSave={handleSaveCanvas}
      />
    </div>
  )
}
