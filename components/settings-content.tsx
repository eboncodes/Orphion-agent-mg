"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Check, Eye, EyeOff, Key, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { validateGroqApiKey, validateTavilyApiKey } from "@/utils/api-keys"

export default function SettingsContent() {
  // Initial values for tracking changes
  const [initialSettings, setInitialSettings] = useState({
    groqApiKey: "",
    tavilyApiKey: "",
  })

  // API keys
  const [groqApiKey, setGroqApiKey] = useState("")
  const [tavilyApiKey, setTavilyApiKey] = useState("")
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [showTavilyKey, setShowTavilyKey] = useState(false)

  // UI states
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Validation states
  const [groqKeyError, setGroqKeyError] = useState<string | null>(null)
  const [tavilyKeyError, setTavilyKeyError] = useState<string | null>(null)
  const [isValidatingGroq, setIsValidatingGroq] = useState(false)
  const [isValidatingTavily, setIsValidatingTavily] = useState(false)

  // Load saved API keys on component mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedGroqKey = localStorage.getItem("groq-api-key") || ""
    const savedTavilyKey = localStorage.getItem("tavily-api-key") || ""

    setGroqApiKey(savedGroqKey)
    setTavilyApiKey(savedTavilyKey)

    // Set initial values for change tracking
    setInitialSettings({
      groqApiKey: savedGroqKey,
      tavilyApiKey: savedTavilyKey,
    })
  }, [])

  // Check for changes
  useEffect(() => {
    const hasChanged = groqApiKey !== initialSettings.groqApiKey || tavilyApiKey !== initialSettings.tavilyApiKey

    setHasChanges(hasChanged)

    // Clear errors when input changes
    if (groqApiKey !== initialSettings.groqApiKey) {
      setGroqKeyError(null)
    }
    if (tavilyApiKey !== initialSettings.tavilyApiKey) {
      setTavilyKeyError(null)
    }
  }, [groqApiKey, tavilyApiKey, initialSettings])

  const handleSaveSettings = async () => {
    try {
      setIsUpdating(true)
      let hasValidationErrors = false
      let shouldSaveGroq = false
      let shouldSaveTavily = false

      // Validate GROQ API key if changed
      if (groqApiKey !== initialSettings.groqApiKey) {
        setIsValidatingGroq(true)
        const groqValidation = await validateGroqApiKey(groqApiKey)
        setIsValidatingGroq(false)

        if (!groqValidation.valid) {
          setGroqKeyError(groqValidation.error || "Invalid API key")
          hasValidationErrors = true
        } else {
          setGroqKeyError(null)
          shouldSaveGroq = true
        }
      }

      // Validate Tavily API key if changed
      if (tavilyApiKey !== initialSettings.tavilyApiKey) {
        setIsValidatingTavily(true)
        const tavilyValidation = await validateTavilyApiKey(tavilyApiKey)
        setIsValidatingTavily(false)

        // For Tavily, we'll save the key even if validation fails
        // This is because the API might be temporarily unavailable
        if (!tavilyValidation.valid) {
          setTavilyKeyError(tavilyValidation.error || "Warning: Could not verify key, but it will be saved")
        } else {
          setTavilyKeyError(null)
        }

        // Always save the Tavily key if it's not empty
        if (tavilyApiKey.trim() !== "") {
          shouldSaveTavily = true
        }
      }

      // If there are validation errors with GROQ, stop here
      if (hasValidationErrors) {
        setIsUpdating(false)
        return
      }

      // Save valid API keys to localStorage
      if (shouldSaveGroq) {
        localStorage.setItem("groq-api-key", groqApiKey)
      }

      if (shouldSaveTavily) {
        localStorage.setItem("tavily-api-key", tavilyApiKey)
      }

      // Update initial settings to match current
      setInitialSettings({
        groqApiKey: shouldSaveGroq ? groqApiKey : initialSettings.groqApiKey,
        tavilyApiKey: shouldSaveTavily ? tavilyApiKey : initialSettings.tavilyApiKey,
      })

      setUpdateSuccess(true)
      setTimeout(() => {
        setUpdateSuccess(false)
        setHasChanges(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving API settings:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full max-w-3xl mx-auto p-4 animate-fadeIn">
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-neutral-400 hover:text-white hover:bg-neutral-800">
            <ArrowLeft size={16} className="mr-2" />
            Back to Chat
          </Button>
        </Link>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">API Settings</CardTitle>
            <CardDescription className="text-neutral-400">
              Manage your API keys for enhanced functionality
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label className="text-neutral-300">API Keys</Label>
              <p className="text-xs text-neutral-500 mb-4">
                Add your own API keys to use with Orphion. Your keys are stored locally and never sent to our servers.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Key size={16} className="text-red-600 mr-2" />
                  <Label htmlFor="groq-api-key" className="text-neutral-300">
                    GROQ API Key
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="groq-api-key"
                    type={showGroqKey ? "text" : "password"}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="Enter your GROQ API key"
                    className={`bg-neutral-800 border-neutral-700 text-white pr-10 focus:border-red-800 focus:ring-red-800 ${
                      groqKeyError ? "border-red-500" : ""
                    }`}
                    disabled={isValidatingGroq}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-white"
                  >
                    {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {isValidatingGroq && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-neutral-400" />
                    </div>
                  )}
                </div>
                {groqKeyError && (
                  <div className="text-xs text-red-500 flex items-start mt-1">
                    <AlertCircle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span>{groqKeyError}</span>
                  </div>
                )}
                <p className="text-xs text-neutral-500">
                  Get your GROQ API key from{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    console.groq.com/keys
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Key size={16} className="text-red-600 mr-2" />
                  <Label htmlFor="tavily-api-key" className="text-neutral-300">
                    Tavily API Key
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="tavily-api-key"
                    type={showTavilyKey ? "text" : "password"}
                    value={tavilyApiKey}
                    onChange={(e) => setTavilyApiKey(e.target.value)}
                    placeholder="Enter your Tavily API key"
                    className={`bg-neutral-800 border-neutral-700 text-white pr-10 focus:border-red-800 focus:ring-red-800 ${
                      tavilyKeyError ? "border-red-500" : ""
                    }`}
                    disabled={isValidatingTavily}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTavilyKey(!showTavilyKey)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-white"
                  >
                    {showTavilyKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {isValidatingTavily && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-neutral-400" />
                    </div>
                  )}
                </div>
                {tavilyKeyError && (
                  <div className="text-xs text-red-500 flex items-start mt-1">
                    <AlertCircle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span>{tavilyKeyError}</span>
                  </div>
                )}
                <p className="text-xs text-neutral-500">
                  Get your Tavily API key from{" "}
                  <a
                    href="https://tavily.com/#api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    tavily.com
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-md bg-neutral-800 p-3 text-sm text-neutral-300">
              <p>Your API keys are stored locally on your device and are never sent to our servers.</p>
              <p className="mt-2">
                These keys enhance Orphion's capabilities with more powerful AI models and search functionality.
              </p>
            </div>
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-2">
            {hasChanges && (
              <Button
                onClick={handleSaveSettings}
                disabled={isUpdating || isValidatingGroq || isValidatingTavily}
                className="bg-red-800 hover:bg-red-700 text-white ml-auto"
              >
                {isUpdating || isValidatingGroq || isValidatingTavily ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {isValidatingGroq || isValidatingTavily ? "Validating..." : "Saving..."}
                  </>
                ) : updateSuccess ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Saved!
                  </>
                ) : (
                  "Save API Settings"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
