"use client"

import { useState } from "react"
import type { TavilySearchResult } from "./web-search-service"

interface WebSearchResultsProps {
  searchResults: TavilySearchResult[]
}

export default function WebSearchResults({ searchResults }: WebSearchResultsProps) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(true) // Add this state for toggling visibility

  // Only show the top 3 results initially
  const displayResults = expanded ? searchResults : searchResults.slice(0, 3)
  const remainingCount = searchResults.length - 3

  // Add a function to toggle visibility
  const toggleVisibility = () => {
    setVisible(!visible)
  }

  // If not visible, return a button to show sources
  if (!visible) {
    return (
      <div className="mt-4 pt-3">
        <button
          onClick={toggleVisibility}
          className="text-sm bg-neutral-800/70 rounded-full px-3 py-1.5 hover:bg-neutral-700/70 transition-colors text-blue-400 hover:text-blue-300"
        >
          Show {searchResults.length} sources
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-3">
      {/* Add a header with close button */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-neutral-500">Sources</span>
        <button onClick={toggleVisibility} className="text-xs text-neutral-500 hover:text-white transition-colors">
          Hide sources
        </button>
      </div>

      {/* Display sources in a horizontal format */}
      <div className="flex flex-wrap gap-2 mb-2">
        {displayResults.map((result, index) => (
          <a
            key={index}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center bg-neutral-800/70 rounded-full px-3 py-1.5 hover:bg-neutral-700/70 transition-colors"
          >
            {/* Favicon */}
            <img
              src={result.favicon || `https://www.google.com/s2/favicons?domain=${extractDomain(result.url)}`}
              alt={result.source_name || "Source"}
              className="w-4 h-4 mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E"
              }}
            />

            {/* Source name */}
            <span className="text-sm text-white mr-1">{result.source_name || extractDomain(result.url)}</span>

            {/* Title as tooltip */}
            <span className="sr-only">{result.title}</span>
          </a>
        ))}

        {/* Show "more sources" button if there are more than 3 sources */}
        {!expanded && remainingCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-sm bg-neutral-800/70 rounded-full px-3 py-1.5 hover:bg-neutral-700/70 transition-colors text-blue-400 hover:text-blue-300"
          >
            +{remainingCount} sources
          </button>
        )}
      </div>
    </div>
  )
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain
  } catch (e) {
    return url
  }
}
