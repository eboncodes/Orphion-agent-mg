"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Import OrphionUI with no SSR to avoid browser API issues
const OrphionUI = dynamic(() => import("../orphion-ui.tsx"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
})

export default function OrphionClientWrapper() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return <OrphionUI />
}
