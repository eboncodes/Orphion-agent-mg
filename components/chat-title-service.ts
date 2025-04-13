import type { ChatSession } from "./chat-storage-service"

// Default model specifically for title generation
const TITLE_GENERATION_MODEL = "llama-3.1-8b-instant"

// Update the system prompt to explicitly request title case instead of all caps
const TITLE_SYSTEM_PROMPT = `You are a specialized AI that creates concise, specific titles for chat conversations.

IMPORTANT RULES:
1. Create a short, specific title (2-5 words) that captures the MAIN TOPIC or QUESTION discussed.
2. Focus on SPECIFIC SUBJECTS, CONCEPTS, or ACTIONS mentioned in the conversation.
3. NEVER use generic phrases like:
  - "Starting our conversation"
  - "Hello"
  - "Assistance needed"
  - "Chat about..."
  - "Discussion on..."
  - "Conversation regarding..."
  - "Help with..."
  - "Information on..."
  - "Question about..."
  - "Inquiry regarding..."
  - "Assistance with..."

4. INSTEAD, extract the SPECIFIC TOPIC, like:
  - "Paris Travel Tips" (not "Travel Assistance")
  - "JavaScript Array Methods" (not "Programming Help")
  - "Vegan Dinner Recipes" (not "Food Discussion")
  - "Climate Change Solutions" (not "Environmental Information")
  - "Resume Writing Tips" (not "Career Assistance")

5. Return ONLY the title text with NO additional formatting, quotes, or explanation.
6. Use proper title case (capitalize first letter of each major word, not all caps).`

/**
 * Generates a title for a chat session based on its content
 * @param session The chat session to generate a title for
 * @returns A promise that resolves to the generated title
 */
export async function generateChatTitle(session: ChatSession): Promise<string> {
  try {
    // If there are no messages or only one message, return a default title
    if (!session.messages || session.messages.length < 2) {
      return "New Chat"
    }

    // Extract the first few messages to use as context for title generation
    // Limit to first 3-4 message exchanges to keep context focused
    const contextMessages = session.messages.slice(0, Math.min(6, session.messages.length))

    // Format the messages into a conversation format
    const conversationText = contextMessages
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n")

    // Create the prompt for title generation
    const titlePrompt = `Based on the following conversation, generate a specific, concise title that captures the main topic:

${conversationText}

Title:`

    // Generate the title using the llama-3.1-8b-instant model
    const title = await generateTitle(titlePrompt)

    // Clean up the title - remove quotes, trailing punctuation, etc.
    return cleanupTitle(title)
  } catch (error) {
    console.error("Error generating chat title:", error)
    // Fall back to a timestamp-based title if generation fails
    return `Chat ${new Date().toLocaleString()}`
  }
}

/**
 * Generates a title using the Groq API with the llama-3.1-8b-instant model
 * @param prompt The prompt to generate a title from
 * @returns A promise that resolves to the generated title
 */
async function generateTitle(prompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY || "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"}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TITLE_GENERATION_MODEL,
        messages: [
          { role: "system", content: TITLE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.8, // Slightly higher temperature for more creative titles
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Title generation API error:", error)
    throw error
  }
}

// Fix the capitalization in the cleanupTitle function to use proper title case instead of all caps

function cleanupTitle(title: string): string {
  let cleanTitle = title
    .trim()
    // Remove quotes
    .replace(/^["']|["']$/g, "")
    // Remove "Title:" prefix if present
    .replace(/^Title:\s*/i, "")
    // Remove trailing punctuation
    .replace(/[.,:;!?]+$/, "")

  // Filter out generic phrases
  const genericPhrases = [
    /^starting\s+(our|the)\s+conversation/i,
    /^hello\b/i,
    /^assistance\s+needed/i,
    /^chat\s+about/i,
    /^discussion\s+on/i,
    /^conversation\s+regarding/i,
    /^help\s+with/i,
    /^information\s+on/i,
    /^question\s+about/i,
    /^inquiry\s+regarding/i,
    /^assistance\s+with/i,
    /^regarding\s+/i,
    /^about\s+/i,
  ]

  // Remove generic phrases from the beginning of the title
  for (const phrase of genericPhrases) {
    cleanTitle = cleanTitle.replace(phrase, "")
  }

  // Trim again after removing phrases
  cleanTitle = cleanTitle.trim()

  // Apply proper title case (first letter of each word capitalized)
  cleanTitle = cleanTitle.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

  // Limit length
  cleanTitle = cleanTitle.substring(0, 50)

  // Default if empty or too short
  if (!cleanTitle || cleanTitle.length < 3) {
    return "New Chat"
  }

  return cleanTitle
}

/**
 * Extracts key topics from messages to create a fallback title
 * @param messages Array of messages to extract topics from
 * @returns A string containing key topics for a title
 */
export function extractKeyTopics(messages: any[]): string {
  // Get all user messages
  const userMessages = messages
    .filter((msg) => msg.sender === "user")
    .map((msg) => msg.content)
    .join(" ")

  // Extract nouns and important words (simplified approach)
  const words = userMessages.split(/\s+/)
  const importantWords = words.filter(
    (word) =>
      word.length > 4 &&
      !/^(the|and|that|with|from|this|have|what|about|your|would|could|should|there|their|they|when|where|which|these|those|some|will|been|being|because)$/i.test(
        word,
      ),
  )

  // Get most frequent words
  const wordCounts: Record<string, number> = {}
  importantWords.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, "")
    if (cleanWord) {
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1
    }
  })

  // Sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

  return sortedWords.join(" ") || "New Chat"
}
