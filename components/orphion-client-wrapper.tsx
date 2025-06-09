"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Loading from "./loading"

// Import OrphionUI with no SSR to avoid browser API issues
const OrphionUI = dynamic(() => import("../orphion-ui"), {
  ssr: false,
  loading: () => <Loading />,
})

export default function OrphionClientWrapper() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <Loading />
  }

  return <OrphionUI />
}
