"use client"

import { useState, useEffect, useCallback } from "react"
import Sidebar from "./components/sidebar"
import MessageBox from "./components/message-box"
import ArchivesView from "./components/archives-view"
import { type ChatSession, getSavedSessions } from "./components/chat-storage-service"
import { useIsMobile } from "./hooks/use-mobile"
import ClientOnly from "./components/client-only"

function OrphionUIContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [savedChats, setSavedChats] = useState<ChatSession[]>([])
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const isMobile = useIsMobile()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [pendingChatId, setPendingChatId] = useState<string | null>(null)
  const [showArchives, setShowArchives] = useState(false)
  const [canvasOpen, setCanvasOpen] = useState(false)

  // Set sidebar closed by default on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    } else {
      setIsSidebarOpen(true)
    }
  }, [isMobile])

  // Prevent sidebar from opening when canvas is open on mobile
  useEffect(() => {
    if (canvasOpen && isMobile) {
      setIsSidebarOpen(false)
    }
  }, [canvasOpen, isMobile])

  const preventSidebarOpen = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [isMobile])

  const handleCanvasOpen = useCallback(
    (isOpen: boolean) => {
      setCanvasOpen(isOpen)
      if (isOpen && isMobile) {
        setIsSidebarOpen(false)
      }
    },
    [isMobile],
  )

  const loadSavedChats = useCallback(() => {
    const chats = getSavedSessions()
    setSavedChats(chats)

    // Check if we have a pending chat that needs to be loaded
    if (pendingChatId) {
      const pendingChat = chats.find((chat) => chat.id === pendingChatId)
      if (pendingChat) {
        console.log("Found pending chat, updating active chat:", pendingChat.id)
        setActiveChat(pendingChat)
        setPendingChatId(null)
      }
    }
  }, [pendingChatId])

  // Load saved chats on mount and check for pending chats
  useEffect(() => {
    loadSavedChats()

    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadSavedChats()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also set up a polling mechanism to check for updates to pending chats
    const intervalId = setInterval(() => {
      if (pendingChatId) {
        console.log("Polling for updates to pending chat:", pendingChatId)
        loadSavedChats()
      }
    }, 2000) // Check every 2 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(intervalId)
    }
  }, [loadSavedChats, pendingChatId])

  // Refresh saved chats when active chat changes
  useEffect(() => {
    if (activeChat) {
      const chats = getSavedSessions()

      // Find the updated version of the active chat
      const updatedActiveChat = chats.find((chat) => chat.id === activeChat.id)

      // If the chat exists and has been updated, update the active chat
      if (updatedActiveChat && updatedActiveChat.messages.length !== activeChat.messages.length) {
        console.log("Active chat has been updated, refreshing:", updatedActiveChat.id)
        setActiveChat(updatedActiveChat)
      }

      setSavedChats(chats)
    }
  }, [activeChat])

  const handleChatSelect = (chatId: string) => {
    const selectedChat = savedChats.find((chat) => chat.id === chatId)
    if (selectedChat) {
      setActiveChat(selectedChat)
      // Clear any pending chat since we're explicitly selecting one
      setPendingChatId(null)
      // Hide archives view when selecting a chat
      setShowArchives(false)
    }
  }

  const handleChatEnd = () => {
    setActiveChat(null)
    // Clear any pending chat when ending a chat
    setPendingChatId(null)
    // Refresh saved chats
    const chats = getSavedSessions()
    setSavedChats(chats)
  }

  // Update the handleHomeClick function to be separate from handleChatEnd
  // This will allow us to specifically handle the Home button click
  const handleHomeClick = () => {
    // First hide archives if showing
    if (showArchives) {
      setShowArchives(false)
    }

    // Add a small delay before clearing active chat to allow for animation
    setTimeout(() => {
      // Clear the active chat to return to the main UI
      setActiveChat(null)

      // Refresh saved chats
      const chats = getSavedSessions()
      setSavedChats(chats)
    }, 50)

    // Don't clear pending chat ID when going home, so we can still detect updates
  }

  // Add a function to handle archive button click
  const handleArchiveClick = () => {
    // First set active chat to null to clear the current view
    setActiveChat(null)

    // Add a small delay before showing archives to allow for animation
    setTimeout(() => {
      setShowArchives(true)

      // Refresh saved chats
      const chats = getSavedSessions()
      setSavedChats(chats)
    }, 50)

    // On mobile, close the sidebar after clicking archive
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  // Add a function to toggle sidebar and pass it to MessageBox
  const toggleSidebar = () => {
    // Don't allow sidebar to open if canvas is open on mobile
    if (canvasOpen && isMobile) {
      return
    }
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Add a function to handle chat creation
  const handleChatCreated = (newChat: ChatSession) => {
    console.log("Chat created:", newChat.id)

    // Prevent duplicate chat creation
    if (isCreatingChat) {
      console.log("Already creating a chat, ignoring")
      return
    }

    setIsCreatingChat(true)

    // Only update active chat if it's different
    if (!activeChat || activeChat.id !== newChat.id) {
      setActiveChat(newChat)

      // Store the chat ID as pending in case user navigates away
      setPendingChatId(newChat.id)

      // Refresh saved chats
      const chats = getSavedSessions()
      setSavedChats(chats)
    }

    // Reset the creating flag after a short delay
    setTimeout(() => {
      setIsCreatingChat(false)
    }, 500)
  }

  // Add a function to handle chat updates (when a response is generated in the background)
  const handleChatUpdated = (updatedChat: ChatSession) => {
    console.log("Chat updated:", updatedChat.id)

    // Update the active chat if it's the one that was updated
    if (activeChat && activeChat.id === updatedChat.id) {
      setActiveChat(updatedChat)
    }

    // Refresh saved chats
    const chats = getSavedSessions()
    setSavedChats(chats)
  }

  // Function to refresh chats
  const refreshChats = () => {
    const chats = getSavedSessions()
    setSavedChats(chats)
  }

  return (
    <div className="flex h-screen bg-black text-white font-serif overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        savedChats={savedChats}
        onChatSelect={handleChatSelect}
        activeChat={activeChat}
        onHomeClick={handleHomeClick}
        onArchiveClick={handleArchiveClick}
        pendingChatId={pendingChatId}
        showingArchives={showArchives}
      />

      {/* Main Content */}
      <div className={`flex-1 flex items-center justify-center ${isMobile ? "p-0" : "p-2"}`}>
        <div
          className={`${isMobile ? "w-full h-full" : "w-[99%] h-[99%] bg-[#0f0f0f] border border-neutral-800 rounded-2xl"} overflow-hidden`}
        >
          {showArchives ? (
            <ArchivesView
              savedChats={savedChats}
              onChatSelect={handleChatSelect}
              onNewChat={handleHomeClick}
              onRefreshChats={refreshChats}
            />
          ) : (
            <MessageBox
              activeChat={activeChat}
              onChatEnd={handleChatEnd}
              onChatCreated={handleChatCreated}
              onChatUpdated={handleChatUpdated}
              onSidebarToggle={toggleSidebar}
              pendingChatId={pendingChatId}
              showSearchSources={true}
              onCanvasOpen={handleCanvasOpen}
              preventSidebarOpen={preventSidebarOpen}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Keep the OrphionUI component as is
export default function OrphionUI() {
  return (
    <div className="flex flex-col min-h-screen">
      <style jsx global>{`
        input, textarea, button, div, span, p, h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-merriweather), serif !important;
        }
      `}</style>

      <ClientOnly fallback={<div>Loading...</div>}>
        <OrphionUIContent />
      </ClientOnly>
    </div>
  )
}
