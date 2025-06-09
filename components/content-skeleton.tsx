"use client"

import { ShimmerEffect } from "./shimmer-effect"

interface ContentSkeletonProps {
  type?: "text" | "code" | "heading" | "list"
  lines?: number
  className?: string
}

export function ContentSkeleton({ type = "text", lines = 3, className }: ContentSkeletonProps) {
  const renderLines = () => {
    const elements = []

    for (let i = 0; i < lines; i++) {
      // For text, vary the width to make it look more natural
      if (type === "text") {
        const width = i === lines - 1 ? `${Math.floor(Math.random() * 30) + 50}%` : "100%"
        elements.push(<ShimmerEffect key={i} className="mb-2" width={width} height="16px" />)
      }
      // For headings, make them larger
      else if (type === "heading") {
        elements.push(
          <ShimmerEffect key={i} className="mb-3" height={i === 0 ? "24px" : "20px"} width={i === 0 ? "70%" : "50%"} />,
        )
      }
      // For lists, add bullet points
      else if (type === "list") {
        elements.push(
          <div key={i} className="flex items-start mb-2">
            <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-neutral-600 shrink-0" />
            <ShimmerEffect width={`${Math.floor(Math.random() * 40) + 50}%`} height="16px" />
          </div>,
        )
      }
    }

    return elements
  }

  // For code blocks, create a special layout
  if (type === "code") {
    return (
      <div className={`mb-4 ${className}`}>
        <div className="code-header">
          <ShimmerEffect width="120px" height="14px" />
          <div className="copy-button">
            <ShimmerEffect width="60px" height="14px" />
          </div>
        </div>
        <div className="bg-[#171717] p-4">{renderLines()}</div>
      </div>
    )
  }

  return <div className={className}>{renderLines()}</div>
}
