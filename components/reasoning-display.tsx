"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ReasoningDisplayProps {
  reasoning: string
  isExpanded?: boolean
  reasoningTime?: number
}

export default function ReasoningDisplay({ reasoning, isExpanded = false, reasoningTime = 10 }: ReasoningDisplayProps) {
  // Force the initial state to be collapsed regardless of the prop
  const [expanded, setExpanded] = useState(false)

  // If no reasoning is provided, don't render anything
  if (!reasoning) return null

  return (
    <div className="mb-4 w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-300 transition-colors w-full py-1"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>Reasoned for {reasoningTime} seconds</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[300px] mt-2 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-neutral-400 text-sm whitespace-pre-wrap pl-4 border-l border-neutral-700 ml-1 max-h-[300px] overflow-y-auto modern-scrollbar">
          {reasoning}
        </div>
      </div>
    </div>
  )
}
