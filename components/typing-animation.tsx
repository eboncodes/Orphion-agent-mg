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
  typingSpeed = 10, // Slower default speed for more visible typing effect
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
      // Add a variable typing speed to make it feel more natural
      // Characters are added one at a time with variable delays
      const randomDelay = Math.max(5, Math.floor(Math.random() * typingSpeed * 2))

      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, randomDelay)

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
          <span className="typing-cursor animate-blink">|</span>
        </span>
      ) : (
        <FormattedText text={text} />
      )}
    </>
  )
}
