import MathTest from "@/components/math-test"
import TrigTest from "@/components/trig-test"
import SimpleMathTest from "@/components/simple-math-test"
import MathJaxTest from "@/components/mathjax-test"
import Link from "next/link"

export default function MathTestPage() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">Math Rendering Test Page</h1>

        <div className="mb-8">
          <MathJaxTest />
        </div>

        <div className="mb-8">
          <SimpleMathTest />
        </div>

        <div className="mb-8">
          <TrigTest />
        </div>

        <div className="mb-8">
          <MathTest />
        </div>

        <div className="mt-8 p-4 bg-neutral-900 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Usage Examples with MathJax</h2>

          <div className="space-y-4 text-neutral-300">
            <p>Simple trigonometric functions:</p>
            <pre className="bg-neutral-800 p-2 rounded overflow-x-auto">{`\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}`}</pre>

            <p>Block math using double dollar signs:</p>
            <pre className="bg-neutral-800 p-2 rounded overflow-x-auto">
              {`$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$`}
            </pre>

            <p>Block math using \\[ and \\]:</p>
            <pre className="bg-neutral-800 p-2 rounded overflow-x-auto">
              {`\\[
m = \\frac{y_2 - y_1}{x_2 - x_1}
\\]`}
            </pre>

            <p>Inline math using single dollar signs:</p>
            <pre className="bg-neutral-800 p-2 rounded overflow-x-auto">
              {`The formula $E = mc^2$ describes the relationship between energy and mass.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
