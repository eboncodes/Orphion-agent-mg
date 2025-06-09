import { generateAIResponse } from "./ai-service"
import { getApiKeys } from "@/utils/api-keys"

// Define the Tavily API response types
export interface TavilySearchResult {
  url: string
  title: string
  content: string
  score: number
  source_name?: string
  favicon?: string
}

export interface TavilyImage {
  url: string
  title: string
  description?: string
}

export interface TavilySearchResponse {
  query: string
  answer: string
  results: TavilySearchResult[]
  images?: TavilyImage[]
}

// Web search enabled message metadata
export interface WebSearchMetadata {
  isWebSearch: boolean
  searchResults?: TavilySearchResult[]
  images?: TavilyImage[]
  originalAnswer?: string
  searchQuery?: string
  searchQueries?: string[] // For multiple searches
  searchMode?: string
}

// Modify the generateSearchQueries function to create more diverse queries
// Find the function that generates search queries for Deep Search mode

// Replace the existing generateSearchQueries function with this simpler version:

// Also update the generateSearchQueries function to clean each query

export async function generateSearchQueries(userQuery: string): Promise<string[]> {
  try {
    // Clean the initial query
    const cleanedUserQuery = cleanSearchQuery(userQuery)

    // Create a prompt to generate diverse search queries
    const prompt = `
I need to perform a comprehensive web search about: "${cleanedUserQuery}"

Please generate 4-5 different search queries that will help me gather comprehensive information about this topic.
The queries should be diverse and help me get a detailed understanding of the topic from different angles.
Don't add specific focuses like "latest developments" or "practical applications" - just create natural variations
that would help gather comprehensive information.

Format your response as a simple list of search queries, one per line, with no additional text.
`

    // Use our AI model to generate diverse search queries
    const { response } = await generateAIResponse(prompt, [])

    // Parse the response into individual queries and clean each one
    const queries = response
      .split("\n")
      .map((q) => cleanSearchQuery(q.trim()))
      .filter((q) => q && q.length > 5)

    // Always include the original cleaned query
    const allQueries = [cleanedUserQuery, ...queries]

    // Remove duplicates and very similar queries
    const uniqueQueries = Array.from(new Set(allQueries))

    // Ensure we have at least 3 queries
    if (uniqueQueries.length < 3) {
      // Add simple variations of the original query
      uniqueQueries.push(`${cleanedUserQuery} detailed information`)
      uniqueQueries.push(`${cleanedUserQuery} comprehensive explanation`)
    }

    console.log("Generated search queries:", uniqueQueries)
    return uniqueQueries.slice(0, 5) // Limit to 5 queries maximum
  } catch (error) {
    console.error("Error generating search queries:", error)
    return [cleanSearchQuery(userQuery)] // Fall back to the original query, but clean it
  }
}

// Update the performSingleSearch function to use the correct Tavily API request format
export async function performSingleSearch(
  query: string,
  searchDepth = "basic",
  maxResults = 5,
): Promise<TavilySearchResponse> {
  try {
    // Clean the query before using it
    const cleanedQuery = cleanSearchQuery(query)

    console.log(`Performing web search for: "${cleanedQuery}" with depth: ${searchDepth}, max results: ${maxResults}`)

    // Get the API key from localStorage
    const { tavilyApiKey } = getApiKeys()

    // Rest of the function remains the same, but use cleanedQuery instead of query

    // If no API key is provided, throw a clear error
    if (!tavilyApiKey || tavilyApiKey.trim() === "") {
      throw new Error("No Tavily API key provided. Please add your API key in the settings.")
    }

    console.log("Using Tavily API key format:", tavilyApiKey.substring(0, 8) + "...")

    // Try with the Authorization header format first (original format)
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tavilyApiKey}`,
      },
      body: JSON.stringify({
        query: cleanedQuery, // Use the cleaned query here
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: "advanced",
        include_images: true,
        include_image_descriptions: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()

      // Check for API key related errors
      if (
        response.status === 401 ||
        response.status === 403 ||
        errorText.includes("API key") ||
        errorText.includes("auth")
      ) {
        throw new Error(`Invalid Tavily API Key: ${errorText}`)
      }

      throw new Error(`Tavily API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log(`Web search results received: ${data.results.length} results for query "${cleanedQuery}"`)

    // Process the results to ensure all required fields
    const processedResults = data.results.map((result: TavilySearchResult) => ({
      ...result,
      title: result.title || result.source_name || "Untitled Source",
      source_name: result.source_name || extractDomain(result.url),
      favicon: result.favicon || `https://www.google.com/s2/favicons?domain=${extractDomain(result.url)}`,
    }))

    return {
      ...data,
      results: processedResults,
      images: data.images || [],
    }
  } catch (error) {
    console.error("Error performing web search:", error)
    throw error
  }
}

// Main search function that handles different modes
export async function performWebSearch(
  query: string,
  mode = "General",
  onSearchProgress?: (query: string, completed: boolean) => void,
): Promise<TavilySearchResponse> {
  try {
    // Determine max results and search depth based on mode
    let maxResults = 5 // Default for General mode
    let searchDepth = "basic" // Default for General mode

    if (mode === "Deep Search") {
      maxResults = 20
      searchDepth = "advanced"
    }

    // For Deep Search, perform multiple searches
    if (mode === "Deep Search") {
      // Generate multiple search queries
      const searchQueries = await generateSearchQueries(query)

      // Array to store all search results
      const allResults: TavilySearchResult[] = []
      const allImages: TavilyImage[] = []
      let combinedAnswer = ""

      // Perform each search sequentially
      for (const searchQuery of searchQueries) {
        // Notify about search start
        if (onSearchProgress) {
          onSearchProgress(searchQuery, false)
        }

        // Perform the search - use 20 results for each query in Deep Search
        const searchResponse = await performSingleSearch(
          searchQuery,
          searchDepth,
          20, // Fixed 20 results for each query in Deep Search
        )

        // Notify about search completion
        if (onSearchProgress) {
          onSearchProgress(searchQuery, true)
        }

        // Collect results
        allResults.push(...searchResponse.results)
        if (searchResponse.images) {
          allImages.push(...searchResponse.images)
        }
        combinedAnswer += searchResponse.answer + "\n\n"
      }

      // Remove duplicate results based on URL
      const uniqueResults = Array.from(new Map(allResults.map((result) => [result.url, result])).values())

      // Remove duplicate images based on URL
      const uniqueImages = Array.from(new Map(allImages.map((image) => [image.url, image])).values())

      // Sort results by score
      uniqueResults.sort((a, b) => (b.score || 0) - (a.score || 0))

      // Return combined results
      return {
        query: query,
        answer: combinedAnswer,
        results: uniqueResults.slice(0, maxResults),
        images: uniqueImages,
      }
    } else {
      // For General mode, just perform a single search
      if (onSearchProgress) {
        onSearchProgress(query, false)
      }

      const result = await performSingleSearch(query, searchDepth, maxResults)

      if (onSearchProgress) {
        onSearchProgress(query, true)
      }

      return result
    }
  } catch (error) {
    console.error("Error performing web search:", error)
    throw error
  }
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

// Function to summarize web search results using our AI model
export async function summarizeWebSearchResults(
  query: string,
  searchResponse: TavilySearchResponse,
  mode = "General",
): Promise<string> {
  try {
    // Create a prompt for the AI to summarize the search results
    let summarizationPrompt = ""

    if (mode === "Deep Search") {
      // For Deep Search, create a more detailed analysis prompt
      summarizationPrompt = `
I need you to create a comprehensive, detailed analysis of the following web search results for the query: "${query}"

Here is the answer provided by the search engine:
${searchResponse.answer}

Here are the top search results:
${searchResponse.results
  .slice(0, 10)
  .map((result) => `- ${result.title}: ${result.content.substring(0, 300)}...`)
  .join("\n\n")}

Please provide a thorough, well-structured analysis that:
1. Explores the topic in depth with multiple perspectives
2. Includes key facts, statistics, and detailed information from the search results
3. Is organized in clear sections with headings where appropriate
4. Provides nuanced insights and connections between different aspects of the topic
5. IMPORTANT: DO NOT include any source citations, references, or links in your response
6. DO NOT mention where the information comes from
7. DO NOT use phrases like "according to [source]" or "as reported by [source]"
8. Just present the information directly as if it's common knowledge
9. DO NOT include any reasoning or thinking process in your response

Your response should be comprehensive, detailed, and informative but should NOT reference any sources at all.
`
    } else {
      // For General mode, use the original summarization prompt
      summarizationPrompt = `
I need you to summarize the following web search results for the query: "${query}"

Here is the answer provided by the search engine:
${searchResponse.answer}

Here are the top search results:
${searchResponse.results
  .slice(0, 5)
  .map((result) => `- ${result.title}: ${result.content.substring(0, 200)}...`)
  .join("\n\n")}

Please provide a comprehensive, well-structured summary that:
1. Directly answers the query
2. Includes key facts and information from the search results
3. Is organized in a clear, readable format
4. IMPORTANT: DO NOT include any source citations, references, or links in your response
5. DO NOT mention where the information comes from
6. DO NOT use phrases like "according to [source]" or "as reported by [source]"
7. Just present the information directly as if it's common knowledge
8. DO NOT include any reasoning or thinking process in your response

Your response should be informative but should NOT reference any sources at all.
`
    }

    // Use our AI model to generate a summary
    const { response } = await generateAIResponse(summarizationPrompt, [])

    // If the AI fails to generate a good summary, fall back to the original answer
    if (!response || response.trim().length < 50) {
      console.log("AI summary was too short, falling back to original answer")
      // Clean the original answer to remove source citations
      return cleanSourceCitations(searchResponse.answer)
    }

    return response
  } catch (error) {
    console.error("Error summarizing web search results:", error)
    return cleanSourceCitations(searchResponse.answer)
  }
}

// Helper function to clean source citations from text
function cleanSourceCitations(text: string): string {
  if (!text) return ""

  // Remove common citation patterns
  let cleaned = text
    // Remove "According to [source]" patterns
    .replace(/according to [^,.]+[,.]/gi, "")
    // Remove "As reported by [source]" patterns
    .replace(/as reported by [^,.]+[,.]/gi, "")
    // Remove "Source: [source]" patterns
    .replace(/source: [^,.]+[,.]/gi, "")
    // Remove "[Source]" patterns
    .replace(/\[[^\]]+\]/g, "")
    // Remove "(Source)" patterns
    .replace(/$$[^)]*source[^)]*$$/gi, "")
    // Remove URL patterns
    .replace(/https?:\/\/[^\s]+/g, "")
    // Remove "from [source]" patterns
    .replace(/from [^,.]+[,.]/gi, "")

  // Clean up any double spaces or punctuation issues created by the removals
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\.\./g, ".")
    .replace(/,,/g, ",")
    .trim()

  return cleaned
}

// Add this helper function at the bottom of the file
function cleanSearchQuery(query: string): string {
  return (
    query
      // Remove any meta instructions that might have slipped through
      .replace(/\b(search for|find information about|look up|query for)\b/gi, "")
      // Remove phrases like "latest" or "current" that are already handled by adding the year
      .replace(/\b(latest|current|recent|up-to-date|newest)\s+/gi, "")
      // Remove any remaining placeholder text
      .replace(/\b(blah|rubbish|garbage|nonsense|stuff|prompt here|here)\b.*$/i, "")
      // Clean up any trailing punctuation or conjunctions
      .replace(/\s*([-,;:]|and|or|the)\s*$/i, "")
      .trim()
  )
}
