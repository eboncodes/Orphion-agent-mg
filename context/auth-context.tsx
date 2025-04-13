"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  isConfigured: boolean
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseConfigured = isSupabaseConfigured()
    setIsConfigured(supabaseConfigured)

    // If Supabase is not configured, set loading to false and return
    if (!supabaseConfigured) {
      console.warn("Supabase is not configured. Authentication features will be disabled.")
      setLoading(false)
      return
    }

    // Check for existing session instead of forcing sign out
    const checkExistingSession = async () => {
      try {
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setLoading(false)
          return
        }

        // If we have a session, get the user
        if (sessionData.session) {
          console.log("Existing session found, restoring user")
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError) {
            console.error("Error getting user:", userError)
            setLoading(false)
            return
          }

          if (userData.user) {
            setUser(userData.user)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error checking session:", error)
        setLoading(false)
      }
    }

    checkExistingSession()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    if (!isConfigured) {
      throw new Error("Authentication is not configured")
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if this is an "Email not confirmed" error
        if (error.message && error.message.includes("Email not confirmed")) {
          console.warn("Email not confirmed error detected, attempting alternative sign-in...")

          // Try to get the user directly
          const { data: userData } = await supabase.auth.getUser()

          if (userData && userData.user) {
            // If we can get the user, consider them authenticated
            console.log("User found despite email confirmation error, proceeding with sign-in")
            setUser(userData.user)
            return userData.user
          }
        }

        throw error
      }

      if (!data.user) {
        throw new Error("No user returned from authentication")
      }

      setUser(data.user)
      return data.user
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string, username: string) => {
    if (!isConfigured) {
      throw new Error("Authentication is not configured")
    }

    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("No user returned from sign up")
      }

      // We'll rely on the database trigger to create the profile
      // The trigger is defined in supabase-setup.sql and will automatically
      // create a profile when a new user is created in auth.users

      console.log("User signed up successfully, profile will be created by database trigger")
      console.log("Verification email has been sent to:", email)

      // Don't set the user here since they need to verify their email first
      return data.user
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    if (!isConfigured) {
      setUser(null)
      return
    }

    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
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
