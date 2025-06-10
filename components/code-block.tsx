"use client"

import dynamic from "next/dynamic"

// Dynamically import Monaco code block with no SSR
const MonacoCodeBlock = dynamic(() => import("./monaco-code-block"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg h-[300px] flex items-center justify-center">
      <div className="loader-small"></div>
    </div>
  ),
})

interface CodeBlockProps {
  language?: string
  title?: string
  children: string
  showLineNumbers?: boolean
}

export default function CodeBlock({ language = "jsx", title, children, showLineNumbers = false }: CodeBlockProps) {
  // If there's no actual code, don't render the code block
  if (!children.trim()) return null

  return (
    <MonacoCodeBlock language={language} title={title} showLineNumbers={showLineNumbers}>
      {children}
    </MonacoCodeBlock>
  )
}
