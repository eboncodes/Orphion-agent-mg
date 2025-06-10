"use client"

import MathRenderer from "./math-renderer"

export default function SimpleMathTest() {
  const examples = [
    {
      label: "Simple Sine",
      math: "sinθ = opposite/hypotenuse",
    },
    {
      label: "Sine with Fraction",
      math: "sin θ = \\frac{opposite}{hypotenuse}",
    },
    {
      label: "Cosine",
      math: "cosθ = adjacent/hypotenuse",
    },
    {
      label: "Tangent",
      math: "tanθ = opposite/adjacent",
    },
    {
      label: "Pythagorean Identity",
      math: "sin²θ + cos²θ = 1",
    },
  ]

  return (
    <div className="p-4 space-y-6 bg-neutral-900 rounded-lg">
      <h2 className="text-xl font-bold text-white">Simple Math Test</h2>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="border border-neutral-800 rounded p-3">
            <h3 className="text-sm text-neutral-400 mb-2">{example.label}</h3>
            <div className="bg-neutral-800 p-2 rounded">
              <MathRenderer math={example.math} block={true} />
            </div>
            <div className="mt-2 text-xs text-neutral-500">Raw input: {example.math}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
