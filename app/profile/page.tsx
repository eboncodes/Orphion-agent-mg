"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import the ProfileContent component with SSR disabled
const ProfileContent = dynamic(() => import("@/components/profile-content"), {
  ssr: false,
  loading: () => <ProfileLoading />,
})

// Loading component
function ProfileLoading() {
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
            <CardDescription className="text-neutral-400">Loading your profile information...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-neutral-800 h-20 w-20 mb-4"></div>
              <div className="h-4 bg-neutral-800 rounded w-48 mb-2"></div>
              <div className="h-3 bg-neutral-800 rounded w-32"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main page component
export default function ProfilePage() {
  return <ProfileContent />
}
