"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface LoadingProps {
  className?: string
}

export default function Loading({ className }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-screen bg-background", className)}>
      <div className="relative flex flex-col items-center">
        {/* Logo container with centered pulse rings */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          {/* Outer pulse ring */}
          <div className="absolute w-full h-full rounded-full animate-ping bg-primary/20" />
          
          {/* Inner pulse ring */}
          <div className="absolute w-full h-full rounded-full animate-ping bg-primary/10" style={{ animationDelay: "0.5s" }} />
          
          {/* Orphion logo */}
          <Image
            src="/images/orphion-logo.png"
            alt="Orphion Logo"
            width={60}
            height={60}
            className="h-16 w-auto animate-pulse"
          />
        </div>

        {/* Spinning up text and spinner */}
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          <span>Spinning up</span>
        </div>
      </div>
    </div>
  )
} 