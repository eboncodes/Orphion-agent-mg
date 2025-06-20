"use client"

import { useState } from "react"
import FallbackMathRenderer from "./fallback-math-renderer"
import dynamic from "next/dynamic"
import KaTeXRenderer from "./katex-renderer"

// Dynamically import MathJax renderer with fallback
const MathJaxRenderer = dynamic(() => import("./mathjax-renderer"), {
  ssr: false,
  loading: () => <div className="loading-math">Loading math renderer...</div>,
})

export default function MathJaxTest() {
  const [mathjaxFailed, setMathjaxFailed] = useState(false)

  const examples = [
    {
      label: "Simple Sine",
      math: "\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}",
    },
    {
      label: "Cosine",
      math: "\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}",
    },
    {
      label: "Tangent",
      math: "\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}",
    },
    {
      label: "Pythagorean Identity",
      math: "\\sin^2\\theta + \\cos^2\\theta = 1",
    },
    {
      label: "Quadratic Formula",
      math: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    },
    {
      label: "Matrix",
      math: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    },
    {
      label: "Integral",
      math: "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)",
    },
    {
      label: "Limit",
      math: "\\lim_{x \\to \\infty} \\frac{1}{x} = 0",
    },
    {
      label: "Sum",
      math: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}",
    },
  ]

  return (
    <div className="p-4 space-y-6 bg-neutral-900 rounded-lg">
      <h2 className="text-xl font-bold text-white">Math Rendering Test</h2>

      <div className="bg-neutral-800 p-3 rounded-lg mb-4">
        <p className="text-neutral-300">
          {mathjaxFailed ? "Using fallback math renderer (MathJax failed to load)" : "Using MathJax renderer"}
        </p>
      </div>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="border border-neutral-800 rounded p-3">
            <h3 className="text-sm text-neutral-400 mb-2">{example.label}</h3>
            <div className="bg-neutral-800 p-2 rounded">
              {mathjaxFailed ? (
                <FallbackMathRenderer math={example.math} block={true} />
              ) : (
                <KaTeXRenderer
                  math={example.math}
                  block={true}
                  onError={() => {
                    console.error("Failed to render math:", example.math)
                  }}
                  theme="dark"
                />
              )}
            </div>
            <div className="mt-2 text-xs text-neutral-500">Raw input: {example.math}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
