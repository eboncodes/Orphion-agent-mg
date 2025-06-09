"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-lg mb-8">An error occurred while loading this page.</p>
      <div className="flex gap-4">
        <button onClick={reset} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md transition-colors">
          Try again
        </button>
        <Link href="/" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  )
}
