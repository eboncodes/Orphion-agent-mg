"use client"

import { useState, useEffect, useRef } from "react"
import { X, Settings, Sparkles, Pyramid, Globe, Check, Mic } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  onIconColorChange: (color: string) => void
  iconColor: string
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
  onIconColorChange,
  iconColor,
  currentLanguageIndex,
  onLanguageChange,
}: SettingsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("general")

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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div
        ref={popupRef}
        className="bg-[#0f0f0f] border border-neutral-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="mr-2" size={20} />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 p-1 m-4 bg-neutral-900 rounded-lg">
            <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-neutral-800">
              General
            </TabsTrigger>
            <TabsTrigger value="language" className="rounded-md data-[state=active]:bg-neutral-800">
              Language
            </TabsTrigger>
            <TabsTrigger value="search" className="rounded-md data-[state=active]:bg-neutral-800">
              Search
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-md data-[state=active]:bg-neutral-800">
              Theme
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-md data-[state=active]:bg-neutral-800">
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-4">
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

          <TabsContent value="language" className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Voice Input Language</h3>
              <div className="space-y-2">
                {SPEECH_LANGUAGES.map((lang, index) => (
                  <div
                    key={lang.code}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      index === currentLanguageIndex ? "bg-red-900/30 border border-red-800" : "bg-neutral-800/50"
                    }`}
                    onClick={() => onLanguageChange(index)}
                  >
                    <div className="flex items-center">
                      <Mic size={18} className="mr-2 text-red-400" />
                      <div>
                        <div className="font-medium">{lang.name}</div>
                        <div className="text-sm text-neutral-400">
                          {lang.code === "en-US" ? "English voice recognition" : "বাংলা ভয়েস রিকগনিশন"}
                        </div>
                      </div>
                    </div>
                    {index === currentLanguageIndex && <Check size={18} className="text-red-400" />}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="search" className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Search Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-sources">Show Sources</Label>
                    <div className="text-sm text-neutral-400">Display source links with search results</div>
                  </div>
                  <Switch
                    id="show-sources"
                    checked={showSearchSources}
                    onCheckedChange={onToggleSearchSources}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-images">Show Images</Label>
                    <div className="text-sm text-neutral-400">Include images in search results</div>
                  </div>
                  <Switch
                    id="show-images"
                    checked={showSearchImages}
                    onCheckedChange={onToggleSearchImages}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Customize Icon</h3>
              <div className="grid grid-cols-7 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full transition-all ${
                      iconColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => onIconColorChange(color.value)}
                    title={color.name}
                    aria-label={`Set icon color to ${color.name}`}
                  />
                ))}
              </div>
              <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg">
                <div className="text-sm text-neutral-400 mb-2">Preview:</div>
                <div className="flex items-center gap-3">
                  <Settings size={24} style={{ color: iconColor }} />
                  <Sparkles size={24} style={{ color: iconColor }} />
                  <Pyramid size={24} style={{ color: iconColor }} />
                  <Globe size={24} style={{ color: iconColor }} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">About Orphion</h3>
              <p className="text-neutral-300">
                Orphion is an advanced AI assistant designed to help you with a wide range of tasks, from answering
                questions to generating creative content.
              </p>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="text-sm text-neutral-400">Version: 1.0.0</div>
                <div className="text-sm text-neutral-400">Build: 2023.05.22</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t border-neutral-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
