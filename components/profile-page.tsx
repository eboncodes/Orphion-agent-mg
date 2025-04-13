"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { ArrowLeft, Camera, Check, Loader2 } from "lucide-react"

export default function ProfilePage({ onBack }: { onBack: () => void }) {
  const { user, updateProfile } = useAuth()
  const [username, setUsername] = useState(user?.user_metadata?.username || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true)
      await updateProfile({ username })
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsUpdating(false)
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
    <div className="w-full max-w-3xl mx-auto p-4 animate-fadeIn">
      <Button variant="ghost" className="mb-4 text-neutral-400 hover:text-white hover:bg-neutral-800" onClick={onBack}>
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-xl text-white">Your Profile</CardTitle>
          <CardDescription className="text-neutral-400">Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-neutral-700">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                <AvatarFallback className="bg-neutral-800 text-white text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full bg-neutral-800 hover:bg-neutral-700 h-8 w-8"
                disabled={true}
              >
                <Camera size={14} />
              </Button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-white">
                {user?.user_metadata?.username || user?.email?.split("@")[0] || "User"}
              </h3>
              <p className="text-sm text-neutral-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-neutral-300">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white focus:border-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-neutral-800 border-neutral-700 text-neutral-400"
              />
              <p className="text-xs text-neutral-500">Email cannot be changed</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateProfile}
            disabled={isUpdating || username === user?.user_metadata?.username}
            className="bg-red-800 hover:bg-red-700 text-white ml-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Updating...
              </>
            ) : updateSuccess ? (
              <>
                <Check size={16} className="mr-2" />
                Updated!
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
