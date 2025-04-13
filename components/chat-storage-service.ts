// Improved chat storage service with proper serialization/deserialization
import { generateChatTitle, extractKeyTopics } from "./chat-title-service"

// Types for messages and chat sessions
export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  reasoning?: string
  generationTime?: number
  versions?: MessageVersion[]
  currentVersionIndex?: number
  webSearchMetadata?: any
  isTyping?: boolean
  hasAttachedImage?: boolean
  imageData?: string
  visionMetadata?: {
    isVisionQuery: boolean
    originalVisionDescription: string
    imageData: string
  }
}

export interface MessageVersion {
  content: string
  reasoning?: string
  generationTime?: number
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  titleGenerated?: boolean
  titleGenerationAttempts?: number
}

// Local storage key
const STORAGE_KEY = "orphion-chats-v2"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined"

// Create a new chat session
export const createChatSession = (): ChatSession => {
  const now = new Date()
  return {
    id: generateId(),
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
    titleGenerated: false,
    titleGenerationAttempts: 0,
  }
}

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Add a message to a chat session
export const addMessage = (
  session: ChatSession,
  content: string,
  sender: "user" | "ai",
  options: {
    reasoning?: string
    generationTime?: number
    versions?: MessageVersion[]
    currentVersionIndex?: number
    webSearchMetadata?: any
    hasAttachedImage?: boolean
    imageData?: string
    visionMetadata?: {
      isVisionQuery: boolean
      originalVisionDescription: string
      imageData: string
    }
  } = {},
): ChatSession => {
  const now = new Date()

  // Create the new message
  const newMessage: Message = {
    id: generateId(),
    content,
    sender,
    timestamp: now,
    ...options,
  }

  // Create a new session object with the message added
  const updatedSession = {
    ...session,
    messages: [...session.messages, newMessage],
    updatedAt: now,
  }

  // Update title based on first user message if it's a new chat
  if (session.title === "New Chat" && sender === "user") {
    // Create a temporary title from the first user message
    const tempTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "")
    updatedSession.title = tempTitle
    // Mark that we need to generate a proper title
    updatedSession.titleGenerated = false
    updatedSession.titleGenerationAttempts = 0
  }

  // Save to local storage
  saveSessionToLocalStorage(updatedSession)

  // If this is the second message (AI's first response), trigger title generation
  if (updatedSession.messages.length === 2 && sender === "ai" && !updatedSession.titleGenerated) {
    generateAndUpdateTitle(updatedSession)
  }

  return updatedSession
}

// Generate and update the title for a chat session
export const generateAndUpdateTitle = async (session: ChatSession): Promise<ChatSession> => {
  try {
    // Only generate title if we have at least one exchange
    if (session.messages.length < 2) return session

    // Mark that we're generating a title to prevent duplicate requests
    const updatedSession = {
      ...session,
      titleGenerated: false,
      titleGenerationAttempts: (session.titleGenerationAttempts || 0) + 1,
    }
    saveSessionToLocalStorage(updatedSession)

    // Generate the title
    const title = await generateChatTitle(session)

    // Check if the title is too generic or too short
    const isTitleGeneric = title === "New Chat" || title.length < 5

    // If title is generic and we haven't tried too many times, use fallback method
    let finalTitle = title
    if (isTitleGeneric && updatedSession.titleGenerationAttempts < 3) {
      // Try extracting key topics as a fallback
      const extractedTopics = extractKeyTopics(session.messages)
      if (extractedTopics && extractedTopics !== "New Chat") {
        finalTitle = extractedTopics
      }
    }

    // Update the session with the new title
    const sessionWithTitle = {
      ...updatedSession,
      title: finalTitle,
      titleGenerated: true,
    }

    // Save to local storage
    saveSessionToLocalStorage(sessionWithTitle)

    return sessionWithTitle
  } catch (error) {
    console.error("Error generating and updating title:", error)
    return session
  }
}

// Update an existing message in a chat session
export const updateMessage = (session: ChatSession, messageId: string, updates: Partial<Message>): ChatSession => {
  const now = new Date()

  // Find and update the message
  const updatedMessages = session.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))

  // Create updated session
  const updatedSession = {
    ...session,
    messages: updatedMessages,
    updatedAt: now,
  }

  // Save to local storage
  saveSessionToLocalStorage(updatedSession)

  return updatedSession
}

// Save session to local storage with proper serialization
export const saveSessionToLocalStorage = (session: ChatSession): void => {
  try {
    // Check if we're in a browser environment
    if (!isBrowser) return

    // Get existing sessions
    const existingSessions = getSavedSessions()

    // Find if this session already exists
    const sessionIndex = existingSessions.findIndex((s) => s.id === session.id)

    if (sessionIndex !== -1) {
      // Update existing session
      existingSessions[sessionIndex] = session
    } else {
      // Add new session
      existingSessions.push(session)
    }

    // Save back to local storage with proper serialization
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSessions, replacer))

    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error saving chat to local storage:", error)
  }
}

// Custom replacer function for JSON.stringify to handle Date objects
function replacer(key: string, value: any) {
  if (value instanceof Date) {
    return { __type: "Date", value: value.toISOString() }
  }
  return value
}

// Custom reviver function for JSON.parse to restore Date objects
function reviver(key: string, value: any) {
  if (value && typeof value === "object" && value.__type === "Date") {
    return new Date(value.value)
  }
  return value
}

// Get all saved sessions from local storage with proper deserialization
export const getSavedSessions = (): ChatSession[] => {
  try {
    // Check if we're in a browser environment
    if (!isBrowser) return []

    const savedSessions = localStorage.getItem(STORAGE_KEY)
    if (!savedSessions) return []

    // Parse with custom reviver to handle dates
    return JSON.parse(savedSessions, reviver) as ChatSession[]
  } catch (error) {
    console.error("Error retrieving chats from local storage:", error)
    return []
  }
}

// Get a specific session by ID
export const getSessionById = (id: string): ChatSession | undefined => {
  const sessions = getSavedSessions()
  return sessions.find((session) => session.id === id)
}

// Delete a session by ID
export const deleteSessionById = (id: string): void => {
  try {
    if (!isBrowser) return

    const sessions = getSavedSessions()
    const updatedSessions = sessions.filter((session) => session.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions, replacer))

    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error deleting chat from local storage:", error)
  }
}

// Delete all sessions (clear storage)
export const deleteAllSessions = (): void => {
  try {
    if (!isBrowser) return

    localStorage.removeItem(STORAGE_KEY)

    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error clearing chat storage:", error)
  }
}

// Migrate data from old storage format if needed
export const migrateFromOldStorage = (): void => {
  try {
    // Skip migration if not in browser
    if (!isBrowser) return

    const OLD_STORAGE_KEY = "orphion-chats"
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)

    if (oldData) {
      console.log("Migrating data from old storage format...")

      // Get current data in new format
      const currentSessions = getSavedSessions()

      // Only migrate if we don't already have data in the new format
      if (currentSessions.length === 0) {
        try {
          // Try to parse old data
          const oldSessions = JSON.parse(oldData)

          // Convert to new format
          const migratedSessions = oldSessions.map((oldSession: any) => {
            // Create a new session with proper dates
            const session: ChatSession = {
              id: oldSession.id || generateId(),
              title: oldSession.title || "Migrated Chat",
              messages: [],
              createdAt: new Date(oldSession.createdAt || Date.now()),
              updatedAt: new Date(oldSession.updatedAt || Date.now()),
              titleGenerated: true,
              titleGenerationAttempts: 0,
            }

            // Convert messages
            if (Array.isArray(oldSession.messages)) {
              session.messages = oldSession.messages.map((msg: any) => ({
                id: msg.id || generateId(),
                content: msg.content || "",
                sender: msg.sender || "user",
                timestamp: new Date(msg.timestamp || Date.now()),
                reasoning: msg.reasoning,
                generationTime: msg.generationTime,
                versions: msg.versions,
                currentVersionIndex: msg.currentVersionIndex,
                webSearchMetadata: msg.webSearchMetadata,
                hasAttachedImage: msg.hasAttachedImage,
                imageData: msg.imageData,
                visionMetadata: msg.visionMetadata,
              }))
            }

            return session
          })

          // Save migrated sessions
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedSessions, replacer))
          console.log("Migration completed successfully")
        } catch (parseError) {
          console.error("Error parsing old storage data:", parseError)
        }
      }
    }
  } catch (error) {
    console.error("Error during storage migration:", error)
  }
}

// Only run migration in browser environment
if (isBrowser) {
  migrateFromOldStorage()
}
