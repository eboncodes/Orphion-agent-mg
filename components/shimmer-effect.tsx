"use client"

import { cn } from "@/lib/utils"

interface ShimmerEffectProps {
  className?: string
  width?: string
  height?: string
}

export function ShimmerEffect({ className, width = "100%", height = "16px" }: ShimmerEffectProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:400%_100%] rounded",
        className,
      )}
      style={{ width, height }}
    />
  )
}
