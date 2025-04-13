"use client"

import type React from "react"

import { useState } from "react"
import { Archive, Search, Trash, Plus, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { type ChatSession, deleteSessionById, deleteAllSessions } from "./chat-storage-service"
import DeleteConfirmation from "./delete-confirmation"

interface ArchivesViewProps {
  savedChats: ChatSession[]
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onRefreshChats: () => void
}

export default function ArchivesView({ savedChats, onChatSelect, onNewChat, onRefreshChats }: ArchivesViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)

  // Filter chats based on search term and sort by most recent first
  const filteredChats = searchTerm
    ? savedChats
        .filter((chat) => chat.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : savedChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Handle delete all chats
  const handleDeleteAllChats = () => {
    setShowDeleteAllConfirmation(true)
  }

  const confirmDeleteAllChats = () => {
    deleteAllSessions()
    setShowDeleteAllConfirmation(false)
    onRefreshChats()
  }

  // Handle delete single chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent chat selection when clicking delete
    setChatToDelete(chatId)
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteSessionById(chatToDelete)
      setChatToDelete(null)
      setShowDeleteConfirmation(false)
      onRefreshChats()
    }
  }

  // Get a preview of the AI's first response in the chat
  const getAIPreview = (chat: ChatSession): string => {
    const aiMessage = chat.messages.find((msg) => msg.sender === "ai")
    if (!aiMessage) return "No response yet"

    // Truncate the message if it's too long
    const preview = aiMessage.content
    return preview.length > 100 ? preview.substring(0, 100) + "..." : preview
  }

  // Format date to a readable string
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="h-full w-full flex flex-col animate-fadeIn">
      {/* Header - Made smaller and more compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-3 py-2 border-b border-neutral-800">
        <div className="flex items-center mb-2 md:mb-0">
          <Archive size={20} className="text-neutral-400 mr-2" />
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">Archives</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-500" size={16} />
            <Input
              className="pl-8 pr-3 py-1 w-full md:w-64 bg-[#1a1a1a] border-neutral-800 rounded-full text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700 h-8"
              placeholder="Search Archives"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between mt-2 md:mt-0 md:justify-start gap-2">
            <button
              onClick={handleDeleteAllChats}
              className={`flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] rounded-full transition-colors text-sm ${
                savedChats.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-800"
              }`}
              disabled={savedChats.length === 0}
            >
              <Trash size={14} />
              <span>Clear All</span>
            </button>
            <button
              onClick={onNewChat}
              className="flex items-center justify-center w-8 h-8 bg-[#1a1a1a] rounded-full hover:bg-neutral-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 pb-6">
        {filteredChats.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#404040 transparent",
            }}
          >
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className="flex flex-col p-4 bg-[#1a1a1a] rounded-lg border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium mb-1 truncate pr-6">{chat.title}</h3>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="text-neutral-500 hover:text-white transition-colors p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <p className="text-neutral-400 text-sm line-clamp-2 mb-2">{getAIPreview(chat)}</p>
                <div className="flex items-center text-neutral-500 text-xs mt-auto">
                  <Clock size={12} className="mr-1" />
                  <span>{formatDate(chat.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-neutral-500">
            <Archive size={60} className="mb-4 opacity-50" />
            <p className="text-lg">No archived chats found</p>
            {searchTerm && <p className="mt-2">Try a different search term</p>}
          </div>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteAllConfirmation}
        onClose={() => setShowDeleteAllConfirmation(false)}
        onConfirm={confirmDeleteAllChats}
      />

      {/* Delete Single Chat Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteChat}
      />
    </div>
  )
}
