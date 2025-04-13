"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import the SettingsContent component with SSR disabled
const SettingsContent = dynamic(() => import("@/components/settings-content"), {
  ssr: false,
  loading: () => <SettingsLoading />,
})

// Loading component
function SettingsLoading() {
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
            <CardDescription className="text-neutral-400">Loading your API settings...</CardDescription>
          </CardHeader>
          <div className="p-6 min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
              <div className="h-4 bg-neutral-800 rounded w-full max-w-md"></div>
              <div className="h-10 bg-neutral-800 rounded w-full max-w-md"></div>
              <div className="h-4 bg-neutral-800 rounded w-3/4 max-w-md"></div>
              <div className="h-10 bg-neutral-800 rounded w-full max-w-md"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Main page component
export default function SettingsPage() {
  return <SettingsContent />
}
