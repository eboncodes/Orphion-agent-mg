// Import the API key utility
import { getApiKeys } from "@/utils/api-keys"

// Interface for vision response
export interface VisionResponse {
  description: string
  error?: string
}

// Process image with vision model
export const analyzeImageWithVision = async (
  imageData: string,
  prompt = "What's in this image?",
): Promise<VisionResponse> => {
  try {
    // Get the API key from localStorage
    const { groqApiKey } = getApiKeys()

    // If no API key is provided, throw a clear error
    if (!groqApiKey || groqApiKey.trim() === "") {
      throw new Error("No GROQ API key provided. Please add your API key in the settings.")
    }

    // Format the message with the image
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt || "What's in this image?",
          },
          {
            type: "image_url",
            image_url: {
              url: imageData,
              detail: "high",
            },
          },
        ],
      },
    ]

    // Make API call to vision model
    console.log("Making API call to vision model")
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: messages,
        max_tokens: 4000,
        temperature: 0.2,
      }),
    })

    // If we get a successful response, process it
    if (response.ok) {
      const data = await response.json()
      return {
        description: data.choices[0].message.content,
      }
    }

    // Otherwise, handle the error
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || response.statusText
    throw new Error(`Vision API Error: ${errorMessage}`)
  } catch (error) {
    console.error("Vision API Error:", error)
    return {
      description: "",
      error: error instanceof Error ? error.message : "Unknown error analyzing image",
    }
  }
}

// Process vision results with deepseek for detailed explanation
export const explainVisionResults = async (visionDescription: string, userPrompt: string): Promise<string> => {
  try {
    // Get the API key from localStorage
    const { groqApiKey } = getApiKeys()

    // If no API key is provided, throw a clear error
    if (!groqApiKey || groqApiKey.trim() === "") {
      throw new Error("No GROQ API key provided. Please add your API key in the settings.")
    }

    // Create a prompt for deepseek to explain the vision results
    const prompt = `
I analyzed an image and here's what I found:

${visionDescription}

${userPrompt ? `The user asked: "${userPrompt}"` : ""}

Please provide a detailed explanation of this image based on my analysis. Include relevant details, context, and any interesting observations.
`

    // Make API call to deepseek
    console.log("Making API call to deepseek for explanation")

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-r1-distill-llama-70b",
          messages: [
            { role: "system", content: "You are an expert at explaining images based on vision model analysis." },
            { role: "user", content: prompt },
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      })

      // If we get a successful response, process it
      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }

      // If we get a 503 Service Unavailable error, return the original vision description
      if (response.status === 503) {
        console.log("Deepseek API returned 503, using original vision description")
        return `Based on my analysis of the image: ${visionDescription}`
      }

      // Otherwise, handle other errors
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`Explanation API Error: ${errorMessage}`)
    } catch (error) {
      // If there's an error with deepseek, fall back to the original vision description
      console.error("Explanation API Error:", error)
      return `Based on my analysis of the image: ${visionDescription}`
    }
  } catch (error) {
    console.error("Explanation API Error:", error)
    return `I analyzed the image and found: ${visionDescription}`
  }
}
