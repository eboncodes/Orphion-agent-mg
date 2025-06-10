"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Globe, Plus, Sparkles, Trash, X, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "./chat-service"
import DeleteConfirmation from "./delete-confirmation"
import TextGenerationLoader from "./text-generation-loader"
import TypingAnimation from "./typing-animation"

export default function ChatContainer() {
  // States
  const [inputValue, setInputValue] = useState("")
  const [chatStarted, setChatStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatStarted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping, chatStarted])

  // Focus input on mount and when chat state changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [chatStarted])

  const handleStartChat = () => {
    if (inputValue.trim() === "") return

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    // Start chat with user message
    setMessages([userMessage])
    setChatStarted(true)
    setIsTyping(true)

    // Clear input
    setInputValue("")

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        content: "Hello, I'm doing fine! What about you?",
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setTypingMessageId(aiMessageId)
      setIsTyping(false)
    }, 2000)
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        content: "Hello, I'm doing fine! What about you?",
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setTypingMessageId(aiMessageId)
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (chatStarted) {
        handleSendMessage()
      } else {
        handleStartChat()
      }
    }
  }

  const handleEndChat = () => {
    setChatStarted(false)
    setMessages([])
    setInputValue("")
    setIsTyping(false)
    setTypingMessageId(null)
  }

  const handleDeleteChat = () => {
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteChat = () => {
    setShowDeleteConfirmation(false)
    handleEndChat()
  }

  return (
    <div className="w-[99%] h-[99%] bg-[#0f0f0f] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Chat Header - Only shown when chat started */}
      {chatStarted && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-neutral-800 text-white text-xs">EB</AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-medium">New Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="text-neutral-400 hover:text-white transition-colors p-1"
              onClick={handleDeleteChat}
              aria-label="Delete chat"
            >
              <Trash size={16} />
            </button>
            <button
              className="text-neutral-400 hover:text-white transition-colors p-1"
              onClick={handleEndChat}
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!chatStarted ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Logo */}
            <div className="mb-4">
              <Image src="/images/orphion-logo.png" alt="Orphion Logo" width={60} height={60} className="h-16 w-auto" />
            </div>

            {/* Heading */}
            <h1 className="text-4xl mb-6 tracking-wide">Need help with anything?</h1>

            {/* Footer */}
            <div className="absolute bottom-3 text-xs text-neutral-500">Orphion Agent Preview</div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
            {messages.map((message, index) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-center"}`}>
                {message.sender === "ai" && (
                  <div className="flex flex-col max-w-[80%] w-[80%]">
                    <div className="flex items-center mb-2">
                      <Image
                        src="/images/orphion-logo.png"
                        alt="Orphion Logo"
                        width={24}
                        height={24}
                        className="h-5 w-auto mr-2"
                      />
                      <span className="text-white text-sm font-medium">Orphion</span>
                    </div>
                    <div className="bg-transparent text-neutral-200 py-2 text-sm leading-relaxed">
                      {message.id === typingMessageId ? (
                        <TypingAnimation text={message.content} onComplete={() => setTypingMessageId(null)} />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                )}

                {message.sender === "user" && (
                  <div className="flex flex-col max-w-[80%] w-[80%]">
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

            {isTyping && (
              <div className="flex justify-center">
                <div className="max-w-[80%] w-[80%]">
                  <TextGenerationLoader />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input - Always shown */}
      <div className="p-4">
        <div className="bg-[#0a0a0a] rounded-2xl p-3 border border-neutral-900">
          <div className="mb-3">
            <Input
              ref={inputRef}
              className="w-full bg-transparent border-none text-sm placeholder:text-neutral-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Ask Anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
          </div>

          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded-full text-sm transition-colors">
              <Sparkles size={14} />
              <span>Auto</span>
            </button>

            <div className="flex items-center gap-2">
              <button className="text-neutral-400 hover:text-white transition-colors">
                <Globe size={18} />
              </button>
              <button className="text-neutral-400 hover:text-white transition-colors">
                <Plus size={18} />
              </button>
              <button
                className={`bg-red-700 hover:bg-red-600 p-1.5 rounded-full transition-colors ${
                  (!inputValue.trim() || isTyping) && "opacity-50 cursor-not-allowed"
                }`}
                onClick={chatStarted ? handleSendMessage : handleStartChat}
                disabled={!inputValue.trim() || isTyping}
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteChat}
      />
    </div>
  )
}
