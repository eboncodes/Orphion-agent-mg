"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import MonacoCodeBlock from "./monaco-code-block"

interface CodeExampleProps {
  code: string
  language?: string
  title?: string
  explanation?: string | React.ReactNode
  className?: string
}

export default function CodeExample({ code, language = "jsx", title, explanation, className }: CodeExampleProps) {
  return (
    <div className={cn("my-4 rounded-lg overflow-hidden border border-neutral-800", className)}>
      <MonacoCodeBlock language={language} title={title}>
        {code}
      </MonacoCodeBlock>

      {/* Explanation (if provided) */}
      {explanation && (
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-sm text-neutral-300">
          {typeof explanation === "string" ? explanation : explanation}
        </div>
      )}
    </div>
  )
}
