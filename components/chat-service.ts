// Chat service to handle message state, AI responses, and local storage
import { v4 as uuidv4 } from "uuid"

export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// Local storage key
const STORAGE_KEY = "orphion-chats"

// Mock AI responses
const aiResponses = [
  "Hello, I'm doing fine! What about you?",
  "I'm Orphion, an AI assistant. How can I help you today?",
  "That's an interesting question. Let me think about it...",
  "I'm designed to provide information and assistance on a wide range of topics.",
  "Is there anything specific you'd like to know more about?",
]

// Get a random AI response
export const getAIResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * aiResponses.length)
  return aiResponses[randomIndex]
}

// Create a new chat session
export const createChatSession = (): ChatSession => {
  const now = new Date()
  return {
    id: uuidv4(),
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

// Add a message to a chat session
export const addMessage = (session: ChatSession, content: string, sender: "user" | "ai"): ChatSession => {
  const now = new Date()
  const newMessage: Message = {
    id: uuidv4(),
    content,
    sender,
    timestamp: now,
  }

  const updatedSession = {
    ...session,
    messages: [...session.messages, newMessage],
    updatedAt: now,
    // Update title based on first user message if it's a new chat
    title:
      session.title === "New Chat" && sender === "user"
        ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
        : session.title,
  }

  // Save to local storage
  saveSessionToLocalStorage(updatedSession)

  return updatedSession
}

// Generate AI response for a user message
export const generateAIResponse = async (session: ChatSession, userMessage: string): Promise<ChatSession> => {
  // Add user message
  let updatedSession = addMessage(session, userMessage, "user")

  // Simulate AI thinking time
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Add AI response
  updatedSession = addMessage(updatedSession, getAIResponse(), "ai")

  return updatedSession
}

// Save session to local storage
export const saveSessionToLocalStorage = (session: ChatSession): void => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return

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

    // Save back to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSessions))

    // Dispatch a storage event to notify other components
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error saving chat to local storage:", error)
  }
}

// Get all saved sessions from local storage
export const getSavedSessions = (): ChatSession[] => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return []

    const savedSessions = localStorage.getItem(STORAGE_KEY)
    if (!savedSessions) return []

    // Parse and fix date objects
    const sessions = JSON.parse(savedSessions) as ChatSession[]
    return sessions.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }))
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
    const sessions = getSavedSessions()
    const updatedSessions = sessions.filter((session) => session.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
  } catch (error) {
    console.error("Error deleting chat from local storage:", error)
  }
}
