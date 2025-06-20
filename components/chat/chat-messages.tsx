"use client"

import { useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import FormattedText from "../formatted-text"
import MessageActions from "../message-actions"
import { type Message } from "../chat-storage-service"
import { type TavilyImage } from "../web-search-service"
import WebSearchResults from "../web-search-results"
import ReasoningDisplay from "../reasoning-display"
import TypingAnimation from "../typing-animation"
import TextGenerationLoader from "../text-generation-loader"

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
  regeneratingMessageId: string | null
  completedMessageIds: Set<string>
  onPreviousVersion: (messageId: string) => void
  onNextVersion: (messageId: string) => void
  onRegenerateMessage: (messageId: string) => void
  onImageClick: (image: TavilyImage) => void
  onOpenCanvas: (messageId: string) => void
  showSearchSources: boolean
  showSearchImages: boolean
  theme: "light" | "dark"
}

export default function ChatMessages({
  messages,
  isTyping,
  regeneratingMessageId,
  completedMessageIds,
  onPreviousVersion,
  onNextVersion,
  onRegenerateMessage,
  onImageClick,
  onOpenCanvas,
  showSearchSources,
  showSearchImages,
  theme,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender === "user" ? "/images/user-avatar.png" : "/images/orphion-logo.png"} />
            <AvatarFallback>{message.sender === "user" ? "U" : "O"}</AvatarFallback>
          </Avatar>

          {/* Message content */}
          <div className="flex-1 space-y-2">
            {/* Message text */}
            <div className="prose prose-invert max-w-none">
              <FormattedText text={message.content} theme={theme} />
            </div>

            {/* Reasoning display */}
            {message.reasoning && <ReasoningDisplay reasoning={message.reasoning} />}

            {/* Web search results */}
            {message.webSearchMetadata?.isWebSearch && message.webSearchMetadata.searchResults && (
              <WebSearchResults searchResults={message.webSearchMetadata.searchResults} />
            )}

            {/* Message actions */}
            <MessageActions
              messageContent={message.content}
              onRegenerate={() => onRegenerateMessage(message.id)}
              onOpenCanvas={() => onOpenCanvas(message.id)}
              isWebSearch={message.webSearchMetadata?.isWebSearch}
              currentLanguageIndex={message.currentVersionIndex}
            />
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/images/orphion-logo.png" />
            <AvatarFallback>O</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <TypingAnimation text="Thinking..." />
            <TextGenerationLoader />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}
