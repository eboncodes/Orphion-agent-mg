"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

interface GlobeGridProps extends React.HTMLAttributes<HTMLDivElement> {
  fullGlobe?: boolean
  size?: number
  dotSize?: number
  dotSpacing?: number
  dotColor?: string
  backgroundColor?: string
  speed?: number
}

export function GlobeGrid({
  fullGlobe = false,
  size = 400,
  dotSize = 0.1,
  dotSpacing = 10,
  dotColor = "rgba(255, 255, 255, 0.5)",
  backgroundColor = "transparent",
  speed = 0.005,
  className,
  ...props
}: GlobeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const globeRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    camera.position.z = 5
    cameraRef.current = camera

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.setSize(size, size)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create globe
    const globe = new THREE.Group()
    globeRef.current = globe
    scene.add(globe)

    // Create dots for the globe
    const radius = 2
    const segments = 36
    const rings = 18

    // Create dots for the globe
    for (let i = 0; i < rings; i++) {
      const phi = (Math.PI * i) / (rings - 1)
      const cosPhi = Math.cos(phi)
      const sinPhi = Math.sin(phi)

      for (let j = 0; j < segments; j++) {
        const theta = (2 * Math.PI * j) / segments
        const cosTheta = Math.cos(theta)
        const sinTheta = Math.sin(theta)

        // Calculate position
        const x = radius * sinPhi * cosTheta
        const y = radius * cosPhi
        const z = radius * sinPhi * sinTheta

        // Only render dots on the visible side if not fullGlobe
        if (fullGlobe || z > -0.5) {
          const dotGeometry = new THREE.SphereGeometry(dotSize, 8, 8)
          const dotMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(dotColor),
            transparent: true,
            opacity: 0.8,
          })
          const dot = new THREE.Mesh(dotGeometry, dotMaterial)
          dot.position.set(x, y, z)
          globe.add(dot)
        }
      }
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      if (globeRef.current) {
        globeRef.current.rotation.y += speed
      }
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [fullGlobe, size, dotSize, dotSpacing, dotColor, speed])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full", className)}
      style={{ backgroundColor }}
      {...props}
    />
  )
}

export function GlobeGridDemo() {
  return <GlobeGrid fullGlobe />
}
