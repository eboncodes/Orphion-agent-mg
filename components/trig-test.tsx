"use client"

import MathRenderer from "./math-renderer"

export default function TrigTest() {
  const examples = [
    {
      label: "Sine",
      math: "\\sin(θ) = \\frac{\\text{opposite side}}{\\text{hypotenuse}}",
    },
    {
      label: "Cosine",
      math: "\\cos(θ) = \\frac{\\text{adjacent side}}{\\text{hypotenuse}}",
    },
    {
      label: "Tangent",
      math: "\\tan(θ) = \\frac{\\text{opposite side}}{\\text{adjacent side}}",
    },
    {
      label: "Fundamental Identity",
      math: "\\sin^2(θ) + \\cos^2(θ) = 1",
    },
    {
      label: "Cosecant",
      math: "\\csc(θ) = \\frac{1}{\\sin(θ)}",
    },
    {
      label: "Secant",
      math: "\\sec(θ) = \\frac{1}{\\cos(θ)}",
    },
    {
      label: "Cotangent",
      math: "\\cot(θ) = \\frac{1}{\\tan(θ)} = \\frac{\\cos(θ)}{\\sin(θ)}",
    },
    {
      label: "Tangent Identity",
      math: "\\tan(θ) = \\frac{\\sin(θ)}{\\cos(θ)}",
    },
    {
      label: "Pythagorean Identity",
      math: "\\tan^2(θ) + 1 = \\sec^2(θ)",
    },
    {
      label: "Co-Function Identity",
      math: "\\sin(θ) = \\cos\\left(\\frac{π}{2} - θ\\right)",
    },
    {
      label: "Co-Function Identity 2",
      math: "\\tan(θ) = \\cot\\left(\\frac{π}{2} - θ\\right)",
    },
  ]

  return (
    <div className="p-4 space-y-6 bg-neutral-900 rounded-lg">
      <h2 className="text-xl font-bold text-white">Trigonometric Functions Test</h2>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="border border-neutral-800 rounded p-3">
            <h3 className="text-sm text-neutral-400 mb-2">{example.label}</h3>
            <div className="bg-neutral-800 p-2 rounded">
              <MathRenderer math={example.math} block={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
