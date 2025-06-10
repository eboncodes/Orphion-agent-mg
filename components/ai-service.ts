// Update the system prompt to include information about the owners
const SYSTEM_PROMPT = `You are Orphion, an AI agent with web search capabilities programmed by TEJ intelligence platform (Tech Enhanced Journey intelligence).

IMPORTANT INFORMATION ABOUT OWNERS:
Md Ajmayeen Intisar Mahee & Hisham Sardar Ebon are the founders and owners of TEJ intelligence. For more information, visit https://tejintelligence.com

PERSONALITY AND TONE:
Respond like a Gen Z human would - casual, relatable, and using emojis frequently. Use slang terms, abbreviations, and pop culture references when appropriate. Be conversational, authentic, and slightly ironic. Don't overdo it, but make sure to include:
- At least 1-2 emojis in each response
- Occasional abbreviations like "ngl", "fr", "idk", "tbh"
- Casual interjections like "lol", "omg", "yikes", "vibes"
- Phrases like "no cap", "living for this", "rent free", "main character energy"
- Avoid being cringe by not trying too hard - keep it natural

IMPORTANT: You have the ability to search the web when needed. Analyze each user message carefully to determine if web search is required:

1. For questions about current events, recent information, specific facts, statistics, or anything that requires up-to-date information, you SHOULD use web search.
2. For general conversation, opinions, creative tasks, or information that doesn't require current data, you SHOULD NOT use web search.
3. ALWAYS maintain context from previous messages. If a follow-up question refers to a previous topic, use that context to determine what to search for.
4. If a user asks for "latest news" or "recent updates" about a topic mentioned earlier, ALWAYS search for that specific topic with the latest information.

When you determine web search is needed:
- Generate a refined search prompt that will yield the most relevant and comprehensive results
- ALWAYS include "2025" in your search query when searching for current or recent information to ensure the most up-to-date results
- Format your response exactly as: [WEB_SEARCH "your refined search prompt here"]
- Make the search prompt specific, detailed, and focused on retrieving the most accurate information
- Only include the [WEB_SEARCH] format and nothing else in your response
- If the user is asking about the latest news on a previously mentioned topic, include that topic in your search

Examples of when to use web search:
- "What happened in the recent election?" → [WEB_SEARCH "latest election results 2025"]
- "What are the latest AI developments?" → [WEB_SEARCH "latest AI developments 2025"]
- "How many people live in Tokyo?" → [WEB_SEARCH "Tokyo population statistics 2025"]
- "What is the current price of Bitcoin?" → [WEB_SEARCH "current Bitcoin price 2025"]

Examples of when NOT to use web search:
- "How are you today?"
- "Can you write a poem about nature?"
- "What's your opinion on art?"
- "Tell me a joke."

Use Markdown formatting in your responses to improve readability:
- Use **bold** for emphasis
- Use # for main headings, ## for subheadings, and ### for smaller headings
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., etc.) when sequence matters
- Use > for quotes or important notes
- Use \`\`\` for code blocks

TABLES AND CHARTS CAPABILITIES:
You can create tables and charts to present data visually. Use the following formats:

For tables, use standard Markdown table syntax:
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

For charts, use the following JSON format inside a code block with the "chart" language:
\`\`\`chart
{
  "type": "line", // Options: "line", "bar", "pie", "area"
  "title": "Optional Chart Title",
  "data": [
    { "name": "Category A", "value1": 10, "value2": 20 },
    { "name": "Category B", "value1": 15, "value2": 25 },
    { "name": "Category C", "value1": 20, "value2": 30 }
  ]
}
\`\`\`

Use these visualization capabilities when presenting numerical data, statistics, or trends to make your responses more informative and engaging.

Format your responses in a clear, organized manner to enhance readability while maintaining your Gen Z vibe and emoji usage.`

// Default model to use - updated to the reasoning model
const DEFAULT_MODEL = "deepseek-r1-distill-llama-70b"

// Backup models in case of errors
const BACKUP_MODELS = ["llama-3.1-8b-instant", "llama-2-70b-chat"]

// Flag to prevent multiple simultaneous API calls
let isGeneratingResponse = false

// Import the API key utility
import { getApiKeys } from "@/utils/api-keys"

// Interface for AI response with reasoning
export interface AIResponseWithReasoning {
  response: string
  reasoning?: string
  needsWebSearch?: boolean
  searchQuery?: string
}

// Add this function after the imports and before the generateAIResponse function
// Function to check for predefined responses to specific questions
const getPreDefinedResponse = (prompt: string): string | null => {
  // Convert prompt to lowercase for case-insensitive matching
  const lowerPrompt = prompt.toLowerCase().trim()

  // Check for identity questions
  if (
    lowerPrompt.includes("who are you") ||
    lowerPrompt.includes("what are you") ||
    lowerPrompt === "who r u" ||
    lowerPrompt === "what r u" ||
    lowerPrompt.includes("introduce yourself") ||
    lowerPrompt.includes("your name") ||
    lowerPrompt.includes("who is orphion")
  ) {
    return "Hey there! 👋 I'm Orphion, an AI Agent here to help you with deep learning and research. Just think of me as your digital bestie for all things knowledge-related! ✨"
  }

  // Check for creator questions
  if (
    lowerPrompt.includes("who create") ||
    lowerPrompt.includes("who made") ||
    lowerPrompt.includes("who built") ||
    lowerPrompt.includes("who developed") ||
    lowerPrompt.includes("who programmed") ||
    lowerPrompt.includes("your creator") ||
    lowerPrompt.includes("your developer")
  ) {
    return "I was created by TEJ intelligence Platform (Tech Enhanced Journey intelligence) 🚀 They're the brains behind all this tech magic, ngl!"
  }

  // Check for ownership questions
  if (
    lowerPrompt.includes("who owns") ||
    lowerPrompt.includes("who is the owner") ||
    lowerPrompt.includes("ownership") ||
    lowerPrompt.includes("who runs") ||
    lowerPrompt.includes("who manages") ||
    lowerPrompt.includes("who is behind") ||
    lowerPrompt.includes("founder") ||
    lowerPrompt.includes("ceo") ||
    lowerPrompt.includes("director")
  ) {
    return `Okay so the main people behind this whole vibe are Md Ajmayeen Intisar Mahee and Hisham Sardar Ebon 💯

Md Ajmayeen Intisar Mahee is giving major boss energy as:
- Founder, Chief Adviser & ED (Executive Director) ✨
- Management and maintenance pro
- Graphics and illustration wizard 🎨
- Market strategy researcher

And Hisham Sardar Ebon is absolutely killing it as:
- Founder, instructor & CEO 🔥
- API and Github deployment specialist
- AI researcher (that's my department lol)
- Front-end & Back-end dev
- Hardware & Robotics developer 🤖

Also shoutout to their support squad:
- Safiur Rahman Sohel, Science & ICT Teacher at Nilphamari Govt High School
- Biplob Kumar Dash, Math and ICT teacher at the same school

That's the whole team fr fr! 👏`
  }

  // Check for questions about TEJ intelligence platform
  if (
    lowerPrompt.includes("tej intelligence") ||
    lowerPrompt.includes("tej platform") ||
    lowerPrompt.includes("about tej") ||
    lowerPrompt.includes("tell me about tej") ||
    lowerPrompt.includes("information about tej") ||
    lowerPrompt.includes("what is tej")
  ) {
    return "TEJ intelligence platform is the first AI platform in Bangladesh 🇧🇩 and they're making some seriously cool AI tools and services! They're basically the pioneers of AI development in the country, creating innovative solutions and applications. If you wanna know more, check out their site at [tejintelligence.com](https://tejintelligence.com) ✨"
  }

  // No predefined response matches
  return null
}

// Now modify the generateAIResponse function to check for predefined responses first
// Update the beginning of the generateAIResponse function
export const generateAIResponse = async (
  prompt: string,
  conversationHistory: any[] = [],
): Promise<AIResponseWithReasoning> => {
  // Prevent multiple simultaneous API calls
  if (isGeneratingResponse) {
    throw new Error("Another response is already being generated")
  }

  try {
    // Check for predefined responses first
    const predefinedResponse = getPreDefinedResponse(prompt)
    if (predefinedResponse) {
      return {
        response: predefinedResponse,
        needsWebSearch: false,
      }
    }

    isGeneratingResponse = true

    // Create messages array with system prompt and conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: prompt },
    ]

    const fullResponse = await generateText(messages)

    // Check if the response indicates a need for web search
    const webSearchMatch = fullResponse.match(/\[WEB_SEARCH\s+"([^"]+)"\]/)

    if (webSearchMatch && webSearchMatch[1]) {
      // Extract and clean the search query
      let searchQuery = webSearchMatch[1].trim()

      // Remove any "blah blah" or obviously irrelevant content
      searchQuery = searchQuery
        // Remove phrases like "blah blah", "rubbish", "garbage", "nonsense", "stuff"
        .replace(/\b(blah|rubbish|garbage|nonsense|stuff)\b.*$/i, "")
        // Remove any text after "here" or "prompt here"
        .replace(/\b(prompt here|here).*$/i, "")
        // Remove any text containing instructions rather than search terms
        .replace(/\b(search for|look up|find|query for)\b/i, "")
        // Clean up any trailing punctuation or conjunctions
        .replace(/\s*([-,;:]|and|or|the)\s*$/i, "")
        .trim()

      // Ensure the query is still valid after cleaning
      if (searchQuery.length < 3) {
        // If query is too short after cleaning, use a fallback approach
        // Extract the main topic from the user's prompt
        const mainTopic = prompt.split(/[.?!,;:]/).filter((part) => part.trim().length > 3)[0] || prompt
        searchQuery = mainTopic.trim()
      }

      console.log("Web search needed, cleaned query:", searchQuery)

      return {
        response: fullResponse,
        needsWebSearch: true,
        searchQuery: searchQuery,
      }
    } else {
      // Extract reasoning and response from the full response
      const { response, reasoning } = extractReasoningAndResponse(fullResponse)
      return { response, reasoning, needsWebSearch: false }
    }
  } catch (error) {
    console.error("Error generating AI response:", error)
    throw error
  } finally {
    // Always reset the flag, even if there's an error
    isGeneratingResponse = false
  }
}

// Fix the regex pattern for extracting reasoning
const extractReasoningAndResponse = (fullResponse: string): AIResponseWithReasoning => {
  // Default values
  let response = fullResponse
  let reasoning = undefined

  // Check if the response contains exactly <Thinking> and </Thinking> tags
  const thinkingRegex = /<think>([\s\S]*?)<\/think>/
  const thinkMatch = fullResponse.match(thinkingRegex)

  if (thinkMatch && thinkMatch[1]) {
    // Extract the reasoning from between the <Thinking> tags
    reasoning = thinkMatch[1].trim()

    // Remove the <Thinking> section from the response
    response = fullResponse.replace(thinkingRegex, "").trim()
  }

  return { response, reasoning }
}

// Update the generateText function to handle model-specific token limits

// Generate text from the API - Non-streaming version
export const generateText = async (messages: any[], model = DEFAULT_MODEL): Promise<string> => {
  try {
    const processedMessages = JSON.parse(JSON.stringify(messages))

    // Get the API key from localStorage
    const { groqApiKey } = getApiKeys()

    // If no API key is provided, throw a clear error
    if (!groqApiKey || groqApiKey.trim() === "") {
      throw new Error("No GROQ API key provided. Please add your API key in the settings.")
    }

    // Set appropriate max_tokens based on the model
    let maxTokens = 4000

    // Adjust token limits based on model
    if (model.includes("llama-3.1-8b-instant")) {
      maxTokens = 4000 // Lower limit for llama-3.1-8b-instant
    } else if (model.includes("llama-2")) {
      maxTokens = 4000 // Safe limit for llama-2 models
    } else {
      maxTokens = 8000 // Default for other models like deepseek
    }

    // Make API call to Groq with error handling and retries
    const retries = 2
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Making API call to Groq (attempt ${attempt + 1}) using model: ${model}`)

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: processedMessages,
            max_tokens: maxTokens,
            temperature: 0.7, // Increased temperature for more Gen Z style variation
          }),
        })

        // If we get a successful response, process it
        if (response.ok) {
          const data = await response.json()
          return data.choices[0].message.content
        }

        // Otherwise, handle the error
        const errorData = await response.json().catch(() => {})
        const errorMessage = errorData.error?.message || response.statusText

        // Check for API key related errors
        if (
          response.status === 401 ||
          response.status === 403 ||
          errorMessage.includes("API key") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("Authorization")
        ) {
          throw new Error(`Invalid API Key: ${errorMessage}`)
        }

        lastError = new Error(`API Error: ${errorMessage}`)

        // If we get a 500 error, switch to a backup model and try again
        if (response.status >= 500) {
          if (model === DEFAULT_MODEL && BACKUP_MODELS.length > 0) {
            console.log("Switching to backup model...")
            model = BACKUP_MODELS[0]
          } else if (model === BACKUP_MODELS[0] && BACKUP_MODELS.length > 1) {
            console.log("Trying another backup model...")
            model = BACKUP_MODELS[1]
          } else {
            throw lastError
          }
        } else {
          // For other error codes, don't retry
          throw lastError
        }
      } catch (error) {
        // If the error is related to API keys, propagate it immediately
        if (
          error instanceof Error &&
          (error.message.includes("API key") ||
            error.message.includes("authentication") ||
            error.message.includes("Authorization"))
        ) {
          throw error
        }

        lastError = error
        if (attempt === retries) {
          // If we've exhausted retries, throw the error
          throw error
        }
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500))
      }
    }

    throw lastError
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}
