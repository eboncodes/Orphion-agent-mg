"use client"

import MathRenderer from "./math-renderer"

export default function MathTest() {
  const examples = [
    { label: "Simple Equation", math: "E = mc^2" },
    { label: "Fraction", math: "\\frac{1}{2}" },
    { label: "Quadratic Formula", math: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
    { label: "Slope Formula", math: "m = \\frac{y_2 - y_1}{x_2 - x_1}" },
    { label: "Greek Letters", math: "\\alpha + \\beta = \\gamma" },
    { label: "Subscripts & Superscripts", math: "E_0 = mc^2" },
    { label: "Text in Math", math: "E = 1 \\, \\text{kg} \\times (3 \\times 10^8 \\, \\text{m/s})^2" },
    { label: "Lorentz Factor", math: "\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}" },
    { label: "Approximate Values", math: "c \\approx 3 \\times 10^8 \\, \\text{m/s}" },
  ]

  return (
    <div className="p-4 space-y-6 bg-neutral-900 rounded-lg">
      <h2 className="text-xl font-bold text-white">Math Rendering Test</h2>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="border border-neutral-800 rounded p-3">
            <h3 className="text-sm text-neutral-400 mb-2">{example.label}</h3>
            <div className="text-white mb-2">Raw: {example.math}</div>
            <div className="bg-neutral-800 p-2 rounded">
              <MathRenderer math={example.math} block={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
