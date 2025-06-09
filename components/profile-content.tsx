"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"

export default function ProfileContent() {
  const { user } = useAuth()
  const initialUsername = user?.user_metadata?.username || user?.email?.split("@")[0] || ""
  const [username, setUsername] = useState(initialUsername)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Check for changes when username is updated
  useEffect(() => {
    setHasChanges(username !== initialUsername)
  }, [username, initialUsername])

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

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setUpdateSuccess(true)
      setTimeout(() => {
        setUpdateSuccess(false)
        setHasChanges(false) // Reset changes after successful update
      }, 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
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
            <CardTitle className="text-xl text-white">Your Profile</CardTitle>
            <CardDescription className="text-neutral-400">Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Avatar className="h-20 w-20 border-2 border-neutral-700">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                <AvatarFallback className="bg-neutral-800 text-white text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-medium text-white">
                  {user?.user_metadata?.username || user?.email?.split("@")[0] || "User"}
                </h3>
                <p className="text-sm text-neutral-400">{user?.email}</p>
                <p className="text-xs text-neutral-500">
                  Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-neutral-300">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white focus:border-red-800 focus:ring-red-800"
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
                className="bg-neutral-800 border-neutral-700 text-neutral-400 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500">Email cannot be changed</p>
            </div>
          </CardContent>
          <CardFooter>
            {hasChanges && (
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
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
                  "Update Profile"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
