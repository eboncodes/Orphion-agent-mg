"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import EmailConfirmation from "./email-confirmation"

export default function SignInScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signIn, signUp, user } = useAuth()

  // Reset form when switching between sign in and sign up
  useEffect(() => {
    setError(null)
    setPassword("")
    // Don't reset email when switching modes to improve UX
  }, [isSignUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        if (!username) {
          throw new Error("Username is required")
        }
        await signUp(email, password, username)
        // Show email confirmation screen instead of automatically signing in
        setEmailSent(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      console.error("Authentication error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during authentication")
    } finally {
      setLoading(false)
    }
  }

  const handleBackFromEmailConfirmation = () => {
    setEmailSent(false)
    setIsSignUp(false)
    // Keep the email but reset other fields
    setPassword("")
    setUsername("")
  }

  // If email has been sent, show the confirmation screen
  if (emailSent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <EmailConfirmation email={email} onBack={handleBackFromEmailConfirmation} />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="flex flex-col items-center justify-center mb-6">
          <Image src="/images/orphion-full-dark.png" alt="Orphion Logo" width={200} height={50} className="mb-6" />
          <h2 className="text-2xl font-bold">{isSignUp ? "Create an account" : "Welcome back"}</h2>
          <p className="text-neutral-400 mt-2">
            {isSignUp ? "Join Orphion to get started" : "Sign in to continue to Orphion"}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  disabled={loading}
                  placeholder="username"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors pr-12"
                  disabled={loading}
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-700 hover:bg-red-600 rounded-lg shadow-sm text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <span>{isSignUp ? "Create account" : "Sign in"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
            disabled={loading}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
