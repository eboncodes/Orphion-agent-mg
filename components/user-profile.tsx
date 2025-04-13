"use client"

import { useState } from "react"
import { LogOut, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface UserProfileProps {
  isCollapsed?: boolean
}

export default function UserProfile({ isCollapsed = false }: UserProfileProps) {
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return "G"

    const username = user.user_metadata?.username || ""
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }

    const email = user.email || ""
    return email ? email.substring(0, 2).toUpperCase() : "U"
  }

  return (
    <div className={`${isCollapsed ? "p-0" : "p-4"} flex items-center transition-all duration-300 ease-out`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <Avatar className="h-8 w-8 border border-neutral-700 transition-all duration-300 hover:border-neutral-500">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-neutral-800 text-white text-xs">{getInitials()}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="ml-2 font-medium transition-opacity duration-300 opacity-100 truncate max-w-[100px]">
                {user?.user_metadata?.username || user?.email?.split("@")[0] || "User"}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1a1a1a] border-neutral-800 text-white">
          <Link href="/profile" className="w-full">
            <DropdownMenuItem className="hover:bg-red-800 focus:bg-red-800 cursor-pointer flex items-center text-white">
              <User size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" className="w-full">
            <DropdownMenuItem className="hover:bg-red-800 focus:bg-red-800 cursor-pointer flex items-center text-white">
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="hover:bg-red-800 focus:bg-red-800 cursor-pointer flex items-center text-white"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            <LogOut size={16} className="mr-2" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
