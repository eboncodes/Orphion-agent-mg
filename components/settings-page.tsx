"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Check, Loader2, Moon, Sun, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const handleSaveSettings = async () => {
    try {
      setIsUpdating(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-fadeIn">
      <Button variant="ghost" className="mb-4 text-neutral-400 hover:text-white hover:bg-neutral-800" onClick={onBack}>
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">Settings</CardTitle>
          <CardDescription className="text-neutral-400">Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-neutral-300">Appearance</Label>
                <p className="text-xs text-neutral-500">Toggle between light and dark mode</p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun size={16} className="text-neutral-400" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-red-800"
                />
                <Moon size={16} className="text-neutral-400" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-neutral-300">Sound Effects</Label>
                <p className="text-xs text-neutral-500">Enable or disable sound effects</p>
              </div>
              <div className="flex items-center space-x-2">
                <VolumeX size={16} className="text-neutral-400" />
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  className="data-[state=checked]:bg-red-800"
                />
                <Volume2 size={16} className="text-neutral-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-300">Volume</Label>
                <span className="text-xs text-neutral-400">{volume}%</span>
              </div>
              <Slider
                disabled={!soundEnabled}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                step={1}
                className={soundEnabled ? "accent-red-800" : "opacity-50"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Privacy</Label>
            <div className="rounded-md bg-neutral-800 p-3 text-sm text-neutral-300">
              <p>Your chat history and API keys are stored locally on your device.</p>
              <p className="mt-2">We do not track your conversations or use them to train AI models.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveSettings}
            disabled={isUpdating}
            className="bg-red-800 hover:bg-red-700 text-white ml-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : updateSuccess ? (
              <>
                <Check size={16} className="mr-2" />
                Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
