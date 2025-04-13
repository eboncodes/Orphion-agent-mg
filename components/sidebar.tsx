"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Home, Menu, PanelRightClose, PanelRightOpen, Archive, X } from "lucide-react"
import Image from "next/image"
import type { ChatSession } from "./chat-storage-service"
import { useIsMobile } from "../hooks/use-mobile"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  savedChats: ChatSession[]
  onChatSelect: (chatId: string) => void
  activeChat: ChatSession | null
  onHomeClick: () => void
  onArchiveClick: () => void
  pendingChatId?: string | null
  showingArchives?: boolean
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  savedChats,
  onChatSelect,
  activeChat,
  onHomeClick,
  onArchiveClick,
  pendingChatId,
  showingArchives = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [archiveOpen, setArchiveOpen] = useState(true)
  const [animatingClosed, setAnimatingClosed] = useState(false)
  const [animatingOpen, setAnimatingOpen] = useState(false)
  const isMobile = useIsMobile()

  // Handle animation states
  useEffect(() => {
    if (!isOpen) {
      setAnimatingClosed(true)
      const timer = setTimeout(() => {
        setAnimatingClosed(false)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setAnimatingOpen(true)
      const timer = setTimeout(() => {
        setAnimatingOpen(false)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close archive dropdown when sidebar is collapsed
  useEffect(() => {
    if (!isOpen) {
      setArchiveOpen(false)
    }
  }, [isOpen])

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Filter chats based on search query
  const filteredChats = savedChats

  // Mobile sidebar overlay
  if (isMobile && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 animate-fadeIn">
        <div className="h-full w-full bg-black flex flex-col animate-slideDown">
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center">
              <Image
                src="/images/orphion-full-dark.png"
                alt="Orphion Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <button className="text-neutral-400 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-2 space-y-1 flex-1 px-2">
            {/* Home with rounded hover effect */}
            <div className="rounded-md overflow-hidden">
              <div
                onClick={() => {
                  onHomeClick()
                  setIsOpen(false)
                }}
                className={`flex items-center px-2 py-3 font-serif ${
                  !activeChat && !showingArchives
                    ? "text-white bg-neutral-800/50"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                } rounded-md`}
                role="button"
                aria-label="Go to home"
              >
                <Home size={20} className="mr-3" />
                <span className="font-serif">Home</span>
              </div>
            </div>

            {/* Archive/Recent Chats section with dropdown */}
            <div className="rounded-md overflow-hidden">
              <div className="flex items-center justify-between w-full px-2 py-3 text-neutral-400 hover:bg-neutral-800/50 hover:text-white rounded-md">
                <div
                  className="flex items-center flex-1 font-serif"
                  onClick={() => {
                    onArchiveClick()
                    setIsOpen(false)
                  }}
                >
                  <Archive size={20} className="mr-3" />
                  <span className="font-serif">Archives</span>
                </div>
                {/* Dropdown icon on the right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setArchiveOpen(!archiveOpen)
                  }}
                  className="p-1"
                >
                  {archiveOpen ? (
                    <ChevronDown size={16} className="text-neutral-400" />
                  ) : (
                    <ChevronRight size={16} className="text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Chat history with bullet points */}
              {archiveOpen && (
                <div className="mt-1 pl-8 space-y-4 text-sm text-neutral-500 animate-slideDown relative">
                  {/* Add a vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-700"></div>

                  {/* Box container with modern scrollbar */}
                  <div className="max-h-[300px] overflow-y-auto modern-scrollbar rounded-md p-2">
                    {filteredChats.length > 0 ? (
                      <ul className="space-y-4">
                        {/* Sort chats by updatedAt timestamp (most recent first) */}
                        {filteredChats
                          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .map((chat, index) => (
                            <li
                              key={chat.id}
                              className={`flex items-center cursor-pointer font-serif ${
                                (activeChat && activeChat.id === chat.id) || pendingChatId === chat.id
                                  ? "text-white"
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                              style={{ transitionDelay: `${index * 50}ms` }}
                              onClick={() => {
                                onChatSelect(chat.id)
                                setIsOpen(false)
                              }}
                            >
                              {/* Add some left padding instead of the connector line */}
                              <div className="w-2"></div>
                              <span className="truncate font-serif">
                                {chat.title}
                                {chat.titleGenerated === false && (
                                  <span className="ml-1 text-xs text-neutral-400 font-serif">(naming...)</span>
                                )}
                              </span>

                              {/* Add a "pending" indicator for chats that are being processed */}
                              {pendingChatId === chat.id && (
                                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="flex items-center justify-center py-3">
                        <span className="italic font-serif">No saved chats</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Empty space where user profile was */}
          <div className="border-t border-neutral-800">
            <div className="p-4"></div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop sidebar or mobile hidden sidebar
  return (
    <>
      {/* Mobile menu button - only visible on mobile when sidebar is closed */}
      {isMobile && !isOpen && (
        <button
          className="fixed top-3 left-3 z-50 p-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Desktop sidebar - hidden on mobile when closed */}
      {(!isMobile || isOpen) && !isMobile && (
        <div
          className={`flex flex-col bg-black transition-all duration-400 ease-in-out ${
            isOpen ? "w-[204px]" : "w-[70px]"
          } ${animatingClosed ? "sidebar-closing" : ""} ${animatingOpen ? "sidebar-opening" : ""}`}
          style={{
            boxShadow: isOpen ? "5px 0 15px rgba(0, 0, 0, 0.1)" : "none",
          }}
        >
          {/* Logo and back button */}
          <div className="flex items-center p-4 gap-2 overflow-hidden">
            {isOpen ? (
              <>
                <div className="flex items-center transition-transform duration-500 ease-out transform translate-x-0 opacity-100">
                  <Image
                    src="/images/orphion-full-dark.png"
                    alt="Orphion Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto transition-all duration-500"
                  />
                </div>
                <PanelRightOpen
                  className="ml-auto text-neutral-400 cursor-pointer hover:text-white transition-all duration-300 hover:scale-110"
                  size={20}
                  onClick={toggleSidebar}
                />
              </>
            ) : (
              <div className="flex justify-center w-full transition-all duration-500 ease-out">
                <Image
                  src="/images/orphion-logo.png"
                  alt="Orphion Logo"
                  width={30}
                  height={30}
                  className="h-8 w-auto transition-all duration-500 ease-out"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav
            className={`mt-4 space-y-1 flex-1 ${isOpen ? "px-2" : "px-0"} transition-all duration-300 ease-out`}
            style={{
              transitionDelay: isOpen ? "150ms" : "0ms",
            }}
          >
            {/* Home with rounded hover effect */}
            <div
              className={`rounded-md overflow-hidden ${!isOpen && "flex justify-center"} transition-all duration-300 ease-out`}
              style={{
                transitionDelay: isOpen ? "200ms" : "0ms",
              }}
            >
              <div
                onClick={onHomeClick}
                className={`flex items-center transition-all duration-300 cursor-pointer font-serif ${
                  isOpen
                    ? `px-2 py-1.5 ${!activeChat && !showingArchives ? "text-white bg-neutral-800/50" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"} rounded-md`
                    : `p-2 ${!activeChat && !showingArchives ? "text-white" : "text-neutral-400 hover:text-white hover:scale-110"}`
                }`}
                role="button"
                aria-label="Go to home"
              >
                <Home size={20} className="transition-transform duration-300" />
                {isOpen && <span className="ml-2 transition-opacity duration-300 opacity-100 font-serif">Home</span>}
              </div>
            </div>

            {/* Archive/Recent Chats section with rounded hover effect */}
            <div
              className={`rounded-md overflow-hidden ${!isOpen && "flex justify-center"} transition-all duration-300 ease-out`}
              style={{
                transitionDelay: isOpen ? "250ms" : "0ms",
              }}
            >
              <div
                className={`flex items-center transition-all duration-300 ${
                  isOpen
                    ? "justify-between w-full px-2 py-1.5 text-neutral-400 hover:bg-neutral-800/50 hover:text-white rounded-md"
                    : "p-2 text-neutral-400 hover:text-white hover:scale-110"
                }`}
              >
                <div className="flex items-center flex-1 cursor-pointer font-serif" onClick={onArchiveClick}>
                  <Archive size={20} className="transition-transform duration-300" />
                  {isOpen && (
                    <span className="ml-2 transition-opacity duration-300 opacity-100 font-serif">Archives</span>
                  )}
                </div>

                {isOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchiveOpen(!archiveOpen)
                    }}
                    className="p-1 focus:outline-none"
                  >
                    {archiveOpen ? (
                      <ChevronDown size={16} className="text-neutral-400 transition-transform duration-300" />
                    ) : (
                      <ChevronRight size={16} className="text-neutral-400 transition-transform duration-300" />
                    )}
                  </button>
                )}
              </div>

              {/* Chat history with bullet points - only show when sidebar is open */}
              {isOpen && archiveOpen && (
                <div className="mt-1 pl-8 space-y-2 text-xs text-neutral-500 transition-all duration-300 ease-out animate-slideDown relative">
                  {/* Add a vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-700"></div>

                  {/* Box container with modern scrollbar */}
                  <div className="max-h-[200px] overflow-y-auto modern-scrollbar rounded-md p-2">
                    {filteredChats.length > 0 ? (
                      <ul className="space-y-2">
                        {/* Sort chats by updatedAt timestamp (most recent first) */}
                        {filteredChats
                          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .map((chat, index) => (
                            <li
                              key={chat.id}
                              className={`flex items-center transition-all duration-300 ease-out cursor-pointer font-serif ${
                                (activeChat && activeChat.id === chat.id) || pendingChatId === chat.id
                                  ? "text-white"
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                              style={{ transitionDelay: `${index * 50}ms` }}
                              onClick={() => onChatSelect(chat.id)}
                            >
                              {/* Add some left padding instead of the connector line */}
                              <div className="w-2"></div>
                              <span className="truncate font-serif">
                                {chat.title}
                                {chat.titleGenerated === false && (
                                  <span className="ml-1 text-xs text-neutral-400 font-serif">(naming...)</span>
                                )}
                              </span>

                              {/* Add a "pending" indicator for chats that are being processed */}
                              {pendingChatId === chat.id && (
                                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="flex items-center justify-center py-2">
                        <span className="italic font-serif">No saved chats</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Toggle button - only show when sidebar is collapsed */}
          {!isOpen && (
            <div className="flex justify-center mb-2 transition-all duration-300 ease-out animate-fadeIn">
              <button
                className="text-neutral-400 hover:text-white transition-all duration-300 p-2 focus:outline-none focus-visible:ring-0 hover:scale-110"
                onClick={toggleSidebar}
              >
                <PanelRightClose size={20} />
              </button>
            </div>
          )}

          {/* Empty space where user profile was */}
          {isOpen ? (
            <div className="border-t border-neutral-800">
              <div className="p-4"></div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="h-8"></div> {/* Empty space */}
            </div>
          )}
        </div>
      )}
    </>
  )
}
