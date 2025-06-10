"use client"

import { useState, useEffect, useRef } from "react"
import { X, Wand2, Sparkles, Pyramid, Globe, Check, Mic, Key, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getApiKeys, saveApiKeys } from "@/utils/api-keys"
import { Input } from "@/components/ui/input"
import { validateGroqApiKey, validateTavilyApiKey } from "@/utils/api-keys"

// Available speech recognition languages
type SpeechLanguage = {
  code: string
  name: string
  placeholder: string
}

const SPEECH_LANGUAGES: SpeechLanguage[] = [
  { code: "en-US", name: "English", placeholder: "Speak in English..." },
  { code: "bn-BD", name: "Bangla", placeholder: "বাংলায় বলুন... (Speak in Bangla...)" },
]

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
  onModeSelect: (mode: string) => void
  selectedMode: string
  showSearchSources: boolean
  showSearchImages: boolean
  onToggleSearchSources: () => void
  onToggleSearchImages: () => void
  currentLanguageIndex: number
  onLanguageChange: (index: number) => void
}

export default function SettingsPopup({
  isOpen,
  onClose,
  onModeSelect,
  selectedMode,
  showSearchSources,
  showSearchImages,
  onToggleSearchSources,
  onToggleSearchImages,
  currentLanguageIndex,
  onLanguageChange,
}: SettingsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [groqApiKey, setGroqApiKey] = useState("")
  const [tavilyApiKey, setTavilyApiKey] = useState("")
  const [apiSuccess, setApiSuccess] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguageIndex)
  // API settings state
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [showTavilyKey, setShowTavilyKey] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [groqKeyError, setGroqKeyError] = useState<string | null>(null)
  const [tavilyKeyError, setTavilyKeyError] = useState<string | null>(null)
  const [isValidatingGroq, setIsValidatingGroq] = useState(false)
  const [isValidatingTavily, setIsValidatingTavily] = useState(false)
  const [initialGroq, setInitialGroq] = useState("")
  const [initialTavily, setInitialTavily] = useState("")

  // Load saved API keys on mount
  useEffect(() => {
    const { groqApiKey, tavilyApiKey } = getApiKeys()
    setGroqApiKey(groqApiKey)
    setTavilyApiKey(tavilyApiKey)
    setInitialGroq(groqApiKey)
    setInitialTavily(tavilyApiKey)
  }, [isOpen])

  // Track changes
  useEffect(() => {
    setHasChanges(groqApiKey !== initialGroq || tavilyApiKey !== initialTavily)
    if (groqApiKey !== initialGroq) setGroqKeyError(null)
    if (tavilyApiKey !== initialTavily) setTavilyKeyError(null)
  }, [groqApiKey, tavilyApiKey, initialGroq, initialTavily])

  // Save and validate API keys
  const handleSaveApiKeys = async () => {
    try {
      setIsUpdating(true)
      let hasValidationErrors = false
      let shouldSaveGroq = false
      let shouldSaveTavily = false

      // Validate GROQ API key if changed
      if (groqApiKey !== initialGroq) {
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
      if (tavilyApiKey !== initialTavily) {
        setIsValidatingTavily(true)
        const tavilyValidation = await validateTavilyApiKey(tavilyApiKey)
        setIsValidatingTavily(false)
        if (!tavilyValidation.valid) {
          setTavilyKeyError(tavilyValidation.error || "Warning: Could not verify key, but it will be saved")
        } else {
          setTavilyKeyError(null)
        }
        if (tavilyApiKey.trim() !== "") {
          shouldSaveTavily = true
        }
      }
      if (hasValidationErrors) {
        setIsUpdating(false)
        return
      }
      if (shouldSaveGroq) {
        localStorage.setItem("groq-api-key", groqApiKey)
      }
      if (shouldSaveTavily) {
        localStorage.setItem("tavily-api-key", tavilyApiKey)
      }
      setInitialGroq(shouldSaveGroq ? groqApiKey : initialGroq)
      setInitialTavily(shouldSaveTavily ? tavilyApiKey : initialTavily)
      setUpdateSuccess(true)
      setTimeout(() => {
        setUpdateSuccess(false)
        setHasChanges(false)
      }, 2000)
    } catch (error) {
      console.error("Error saving API settings:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle language change
  const handleLanguageChange = (index: number) => {
    setSelectedLanguage(index)
    onLanguageChange(index)
    localStorage.setItem("orphion-speech-language", index.toString())
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Predefined color options
  const colorOptions = [
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Purple", value: "#a855f7" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Teal", value: "#14b8a6" },
  ]

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>Customize your Orphion experience.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Chat Mode</h3>
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    selectedMode === "General" ? "bg-red-900/30 border border-red-800" : "bg-neutral-800/50"
                  }`}
                  onClick={() => onModeSelect("General")}
                >
                  <div className="flex items-center">
                    <Sparkles size={18} className="mr-2 text-red-400" />
                    <div>
                      <div className="font-medium">General</div>
                      <div className="text-sm text-neutral-400">Standard chat mode for general questions</div>
                    </div>
                  </div>
                  {selectedMode === "General" && <Check size={18} className="text-red-400" />}
                </div>

                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    selectedMode === "Deep Search" ? "bg-red-900/30 border border-red-800" : "bg-neutral-800/50"
                  }`}
                  onClick={() => onModeSelect("Deep Search")}
                >
                  <div className="flex items-center">
                    <Pyramid size={18} className="mr-2 text-red-400" />
                    <div>
                      <div className="font-medium">Deep Search</div>
                      <div className="text-sm text-neutral-400">Enhanced search for complex questions</div>
                    </div>
                  </div>
                  {selectedMode === "Deep Search" && <Check size={18} className="text-red-400" />}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="language">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Speech Recognition Language</h3>
              <div className="flex flex-col gap-2">
                {SPEECH_LANGUAGES.map((lang, idx) => (
                  <label key={lang.code} className={`flex items-center p-2 rounded cursor-pointer ${selectedLanguage === idx ? "bg-red-900/30 border border-red-800" : "bg-neutral-800/50"}`}>
                    <input
                      type="radio"
                      name="speech-language"
                      checked={selectedLanguage === idx}
                      onChange={() => handleLanguageChange(idx)}
                      className="mr-2 accent-red-600"
                    />
                    {lang.name}
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="api">
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
                  <Label htmlFor="groq-api-key" className="text-neutral-300">GROQ API Key</Label>
                </div>
                <div className="relative">
                  <Input
                    id="groq-api-key"
                    type={showGroqKey ? "text" : "password"}
                    value={groqApiKey}
                    onChange={e => setGroqApiKey(e.target.value)}
                    placeholder="Enter your GROQ API key"
                    className={`bg-neutral-800 border-neutral-700 text-white pr-10 focus:border-red-800 focus:ring-red-800 ${groqKeyError ? "border-red-500" : ""}`}
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
                  Get your GROQ API key from {" "}
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
                  <Label htmlFor="tavily-api-key" className="text-neutral-300">Tavily API Key</Label>
                </div>
                <div className="relative">
                  <Input
                    id="tavily-api-key"
                    type={showTavilyKey ? "text" : "password"}
                    value={tavilyApiKey}
                    onChange={e => setTavilyApiKey(e.target.value)}
                    placeholder="Enter your Tavily API key"
                    className={`bg-neutral-800 border-neutral-700 text-white pr-10 focus:border-red-800 focus:ring-red-800 ${tavilyKeyError ? "border-red-500" : ""}`}
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
                  Get your Tavily API key from {" "}
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
            {hasChanges && (
              <button
                onClick={handleSaveApiKeys}
                disabled={isUpdating || isValidatingGroq || isValidatingTavily}
                className="w-full p-2 bg-red-800 hover:bg-red-700 text-white rounded-md mt-4 flex items-center justify-center"
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
              </button>
            )}
            {updateSuccess && !hasChanges && (
              <div className="text-green-500 text-sm mt-2 flex items-center justify-center">
                <Check size={16} className="mr-1" />
                API keys updated!
              </div>
            )}
          </TabsContent>
          <TabsContent value="about">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">About Orphion</h3>
              <div className="text-sm text-neutral-400">
                Orphion is an AI-powered chat assistant that helps you with various tasks and questions.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
