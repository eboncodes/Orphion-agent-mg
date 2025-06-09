"use client"
import { Code, Edit } from "lucide-react"

interface CodeEditorToggleProps {
  useMonaco: boolean
  onToggle: (useMonaco: boolean) => void
}

export default function CodeEditorToggle({ useMonaco, onToggle }: CodeEditorToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        onClick={() => onToggle(false)}
        className={`p-1 rounded-md ${
          !useMonaco ? "bg-neutral-700 text-white" : "bg-transparent text-neutral-400 hover:text-white"
        }`}
        title="Simple code view"
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`p-1 rounded-md ${
          useMonaco ? "bg-neutral-700 text-white" : "bg-transparent text-neutral-400 hover:text-white"
        }`}
        title="Monaco editor view"
      >
        <Edit size={16} />
      </button>
    </div>
  )
}
