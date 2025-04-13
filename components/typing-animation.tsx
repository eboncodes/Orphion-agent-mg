"use client"

import { useState, useEffect } from "react"
import FormattedText from "./formatted-text"
import React from "react"

interface TypingAnimationProps {
  text: string
  onComplete?: () => void
  typingSpeed?: number
  isComplete?: boolean
}

export default function TypingAnimation({
  text,
  onComplete,
  typingSpeed = 1, // Much faster default speed
  isComplete = false,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFinished, setIsFinished] = useState(isComplete)

  // Add a unique key based on text content to ensure proper re-rendering
  const textKey = React.useMemo(() => text, [text])

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text)
      setCurrentIndex(text.length)
      setIsFinished(true)
      onComplete?.()
      return
    }

    if (currentIndex < text.length) {
      // Calculate how many characters to add per tick
      // This creates a more natural streaming effect with variable speeds
      const charsToAdd = Math.max(1, Math.floor(text.length / 100) + 1)

      const timeout = setTimeout(() => {
        const nextIndex = Math.min(currentIndex + charsToAdd, text.length)
        setDisplayedText(text.substring(0, nextIndex))
        setCurrentIndex(nextIndex)
      }, typingSpeed)

      return () => clearTimeout(timeout)
    } else if (!isFinished) {
      setIsFinished(true)
      onComplete?.()
    }
  }, [currentIndex, text, typingSpeed, isFinished, onComplete, isComplete])

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText("")
    setCurrentIndex(0)
    setIsFinished(false)
  }, [textKey])

  return (
    <>
      {!isFinished ? (
        <span className="inline-block">
          {displayedText}
          <span className="typing-cursor">|</span>
        </span>
      ) : (
        <FormattedText text={text} />
      )}
    </>
  )
}
