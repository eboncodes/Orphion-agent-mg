"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

// Define a minimal User type to replace Supabase's User
type User = {
  id: string
  email?: string | null
  user_metadata?: {
    username?: string
    avatar_url?: string
  }
  created_at?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  isConfigured: boolean
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  updateProfile?: (data: { username: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Always set isConfigured to false since we're removing Supabase
  const isConfigured = false

  const handleSignIn = async () => {
    throw new Error("Authentication is not available")
  }

  const handleSignUp = async () => {
    throw new Error("Authentication is not available")
  }

  const handleSignOut = async () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        isConfigured,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
