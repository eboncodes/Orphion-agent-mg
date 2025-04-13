"use client"

import { useAuth } from "@/context/auth-context"
import { LogIn, UserPlus, AlertTriangle } from "lucide-react"

export default function AuthButtons() {
  const { setShowAuthModal, isConfigured } = useAuth()

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  // If Supabase is not configured, show a warning message
  if (!isConfigured) {
    return (
      <div className="p-4 flex flex-col gap-2 transition-all duration-300 ease-out">
        <div className="flex items-center gap-2 text-amber-500 text-sm">
          <AlertTriangle size={16} />
          <span>Auth not configured</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-2 transition-all duration-300 ease-out">
      <button
        onClick={handleSignInClick}
        className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
      >
        <LogIn size={16} />
        <span>Sign In</span>
      </button>
      <button
        onClick={() => {
          setShowAuthModal(true)
        }}
        className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        <UserPlus size={16} />
        <span>Sign Up</span>
      </button>
    </div>
  )
}
