"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Key, X } from "lucide-react"
import { getMissingApiKeys } from "@/utils/api-keys"

interface ApiKeyWarningProps {
  isOpen: boolean
  onClose: () => void
}

export default function ApiKeyWarning({ isOpen, onClose }: ApiKeyWarningProps) {
  const [showWarning, setShowWarning] = useState(isOpen)
  const [missingKeys, setMissingKeys] = useState({ groq: false, tavily: false })

  useEffect(() => {
    setShowWarning(isOpen)
    if (isOpen) {
      // Check which keys are missing when the warning is opened
      setMissingKeys(getMissingApiKeys())
    }
  }, [isOpen])

  const handleClose = () => {
    setShowWarning(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }

  // Navigate to settings page
  const navigateToSettings = () => {
    // Close the modal first
    handleClose()
    // Use window.location for direct navigation
    window.location.href = "/settings"
  }

  // Determine the warning message based on which keys are missing
  const getWarningMessage = () => {
    if (missingKeys.groq && missingKeys.tavily) {
      return "Orphion requires both GROQ and Tavily API keys to function. You need to add these keys in settings."
    } else if (missingKeys.groq) {
      return "Orphion requires a GROQ API key to function. You need to add this key in settings."
    } else if (missingKeys.tavily) {
      return "Orphion requires a Tavily API key for web search functionality. You need to add this key in settings."
    }
    return "API keys are required to use this feature."
  }

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md bg-neutral-900 rounded-lg overflow-hidden border border-red-800"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 to-red-600"></div>

            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-red-900/30 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-white">API Keys Required</h3>
                  <p className="mt-2 text-sm text-neutral-300">{getWarningMessage()}</p>
                  <div className="mt-4 bg-black/30 p-3 rounded border border-neutral-800 text-xs text-neutral-400">
                    <p>You can get your API keys from:</p>
                    <ul className="mt-2 space-y-1">
                      {missingKeys.groq && (
                        <li>
                          • GROQ API:{" "}
                          <a
                            href="https://console.groq.com/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:underline"
                          >
                            console.groq.com
                          </a>
                        </li>
                      )}
                      {missingKeys.tavily && (
                        <li>
                          • Tavily API:{" "}
                          <a
                            href="https://tavily.com/#api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:underline"
                          >
                            tavily.com
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 ml-4 text-neutral-400 hover:text-white"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-md text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors"
                  onClick={navigateToSettings}
                >
                  <Key className="inline-block mr-2 h-4 w-4" />
                  Add API Keys
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
