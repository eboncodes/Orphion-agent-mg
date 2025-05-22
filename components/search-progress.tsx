"use client"

interface SearchProgressProps {
  queries: string[]
  completedQueries: string[]
}

export default function SearchProgress({ queries, completedQueries }: SearchProgressProps) {
  if (queries.length === 0) return null

  return (
    <div className="mt-3 space-y-1 animate-fadeIn">
      {queries.map((query, index) => {
        const isCompleted = completedQueries.includes(query)
        // Only show queries that are still in progress
        if (isCompleted) return null

        return (
          <div key={index} className="flex items-center text-sm text-neutral-400">
            <span>Searching the web about "{query}"</span>
          </div>
        )
      })}
    </div>
  )
}
