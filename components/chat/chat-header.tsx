"use client"

import { Menu, ChevronLeft, ChevronRight, Pyramid, Sparkles } from "lucide-react"
import Image from "next/image"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"

interface ChatHeaderProps {
  currentMode: string
  onModeSelect: (mode: string) => void
  onSidebarToggle?: () => void
  onClose: () => void
}

export default function ChatHeader({
  currentMode,
  onModeSelect,
  onSidebarToggle,
  onClose,
}: ChatHeaderProps) {
  const isMobile = useIsMobile()

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Deep Search":
        return <Pyramid size={16} className="mr-2" />
      default:
        return <Sparkles size={16} className="mr-2" />
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {isMobile && (
          <button onClick={onSidebarToggle} className="p-2 hover:bg-accent rounded-lg">
            <Menu size={20} />
          </button>
        )}
        <Image src="/images/orphion-logo.png" alt="Orphion Logo" width={60} height={60} className="h-16 w-auto" />
      </div>

      {/* Center section - Mode selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent">
          {getModeIcon(currentMode)}
          <span>{currentMode}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onModeSelect("General")}>
            <Sparkles size={16} className="mr-2" />
            General
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onModeSelect("Deep Search")}>
            <Pyramid size={16} className="mr-2" />
            Deep Search
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  )
} 