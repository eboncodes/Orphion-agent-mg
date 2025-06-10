// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined"

export function checkApiKeysExist(): boolean {
  // Check if we're in a browser environment
  if (!isBrowser) {
    return false
  }

  // Check if both API keys exist in localStorage
  const groqApiKey = localStorage.getItem("groq-api-key")
  const tavilyApiKey = localStorage.getItem("tavily-api-key")

  // Return true only if both keys exist and are not empty strings
  return !!(groqApiKey && tavilyApiKey && groqApiKey.trim() !== "" && tavilyApiKey.trim() !== "")
}

// Add new functions to check for specific keys
export function checkGroqApiKeyExists(): boolean {
  if (!isBrowser) return false
  const groqApiKey = localStorage.getItem("groq-api-key")
  return !!(groqApiKey && groqApiKey.trim() !== "")
}

export function checkTavilyApiKeyExists(): boolean {
  if (!isBrowser) return false
  const tavilyApiKey = localStorage.getItem("tavily-api-key")
  return !!(tavilyApiKey && tavilyApiKey.trim() !== "")
}

// Function to determine which keys are missing
export function getMissingApiKeys(): { groq: boolean; tavily: boolean } {
  if (!isBrowser) {
    return { groq: true, tavily: true }
  }

  return {
    groq: !checkGroqApiKeyExists(),
    tavily: !checkTavilyApiKeyExists(),
  }
}

export function getApiKeys(): { groqApiKey: string; tavilyApiKey: string } {
  // Default to empty strings
  let groqApiKey = ""
  let tavilyApiKey = ""

  // Only try to access localStorage in browser environment
  if (isBrowser) {
    groqApiKey = localStorage.getItem("groq-api-key") || ""
    tavilyApiKey = localStorage.getItem("tavily-api-key") || ""
  }

  return { groqApiKey, tavilyApiKey }
}

export function saveApiKeys(groqApiKey: string, tavilyApiKey: string): void {
  // Only try to access localStorage in browser environment
  if (isBrowser) {
    if (groqApiKey && groqApiKey.trim() !== "") {
      localStorage.setItem("groq-api-key", groqApiKey.trim())
    }

    if (tavilyApiKey && tavilyApiKey.trim() !== "") {
      localStorage.setItem("tavily-api-key", tavilyApiKey.trim())
    }
  }
}

export function clearApiKeys(): void {
  // Only try to access localStorage in browser environment
  if (isBrowser) {
    localStorage.removeItem("groq-api-key")
    localStorage.removeItem("tavily-api-key")
  }
}

// Add these new validation functions to the file

// Function to validate GROQ API key
export async function validateGroqApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!apiKey || apiKey.trim() === "") {
      return { valid: false, error: "API key cannot be empty" }
    }

    // Make a simple request to the GROQ API to check if the key is valid
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      return { valid: true }
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || response.statusText
      return { valid: false, error: `Invalid GROQ API key: ${errorMessage}` }
    }
  } catch (error) {
    console.error("Error validating GROQ API key:", error)
    return { valid: false, error: "Error validating API key. Please check your internet connection." }
  }
}

// Function to validate Tavily API key
export async function validateTavilyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!apiKey || apiKey.trim() === "") {
      return { valid: false, error: "API key cannot be empty" }
    }

    // Make a simple request to the Tavily API search endpoint to check if the key is valid
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: "test query",
        search_depth: "basic",
        max_results: 1,
      }),
    })

    if (response.ok) {
      return { valid: true }
    } else {
      const errorText = await response.text()
      return { valid: false, error: `Invalid Tavily API key: ${errorText || response.statusText}` }
    }
  } catch (error) {
    console.error("Error validating Tavily API key:", error)
    // If there's a network error, assume the key might be valid
    // This prevents rejecting valid keys when the API is temporarily unavailable
    return { valid: true, error: "Warning: Could not verify key due to network issues, but key was saved" }
  }
}

// Function to navigate to API settings page
export function navigateToApiSettings(): void {
  if (isBrowser) {
    window.location.href = "/settings"
  }
}
