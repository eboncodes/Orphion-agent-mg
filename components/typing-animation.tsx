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
  const [visibleChars, setVisibleChars] = useState<boolean[]>([])

  // Add a unique key based on text content to ensure proper re-rendering
  const textKey = React.useMemo(() => text, [text])

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text)
      setCurrentIndex(text.length)
      setIsFinished(true)
      setVisibleChars(new Array(text.length).fill(true))
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

        // Update visible characters array with fade-in effect
        const newVisibleChars = [...visibleChars]
        for (let i = currentIndex; i < nextIndex; i++) {
          newVisibleChars[i] = true
        }
        setVisibleChars(newVisibleChars)

        setCurrentIndex(nextIndex)
      }, typingSpeed)

      return () => clearTimeout(timeout)
    } else if (!isFinished) {
      setIsFinished(true)
      onComplete?.()
    }
  }, [currentIndex, text, typingSpeed, isFinished, onComplete, isComplete, visibleChars])

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText("")
    setCurrentIndex(0)
    setIsFinished(false)
    setVisibleChars(new Array(text.length).fill(false))
  }, [textKey, text.length])

  // Render the text with fade-in animation for each character
  const renderAnimatedText = () => {
    return text
      .substring(0, currentIndex)
      .split("")
      .map((char, index) => (
        <span
          key={index}
          className={`inline-block transition-opacity duration-200 ${
            visibleChars[index] ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animationDelay: `${index * 0.01}s`,
            transitionDelay: `${index * 0.01}s`,
          }}
        >
          {char}
        </span>
      ))
  }

  return (
    <>
      {!isFinished ? (
        <span className="inline-block">
          {renderAnimatedText()}
          <span className="typing-cursor">|</span>
        </span>
      ) : (
        <FormattedText text={text} />
      )}
    </>
  )
}
