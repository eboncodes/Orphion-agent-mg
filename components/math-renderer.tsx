"use client"

interface MathRendererProps {
  math: string
  block?: boolean
  className?: string
}

// Enhanced MathRenderer with comprehensive LaTeX support
export default function MathRenderer({ math, block = false, className = "" }: MathRendererProps) {
  // Process the math content with all formatting functions
  const processedMath = (content: string): string => {
    let result = content.trim()

    // Pre-process to handle common patterns without LaTeX commands
    result = preprocessMath(result)

    // Apply all formatting functions in the right order
    result = formatSpecialCommands(result)
    result = formatTrigFunctions(result)
    result = formatGreekLetters(result)
    result = formatMathSymbols(result)
    result = formatSuperscriptsAndSubscripts(result)
    result = formatFractions(result)
    result = formatSqrt(result)
    result = formatText(result)
    result = formatSpaces(result)
    result = formatParentheses(result)

    return result
  }

  // Pre-process math to handle common patterns without LaTeX commands
  const preprocessMath = (text: string): string => {
    // Handle trigonometric functions without backslash
    const trigFunctions = ["sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan"]

    let result = text

    // Replace trigonometric functions without backslash with their LaTeX command
    for (const func of trigFunctions) {
      // Match the function name followed by a letter or number without space
      const regex = new RegExp(`\\b${func}([a-zA-Z0-9θ])`, "g")
      result = result.replace(regex, `\\${func}$1`)

      // Also match the function name followed by space
      const regexWithSpace = new RegExp(`\\b${func}\\s`, "g")
      result = result.replace(regexWithSpace, `\\${func} `)
    }

    return result
  }

  // Format trigonometric functions
  const formatTrigFunctions = (text: string): string => {
    const trigFunctions: Record<string, string> = {
      "\\sin": '<span class="math-trig">sin</span>',
      "\\cos": '<span class="math-trig">cos</span>',
      "\\tan": '<span class="math-trig">tan</span>',
      "\\csc": '<span class="math-trig">csc</span>',
      "\\sec": '<span class="math-trig">sec</span>',
      "\\cot": '<span class="math-trig">cot</span>',
      "\\arcsin": '<span class="math-trig">arcsin</span>',
      "\\arccos": '<span class="math-trig">arccos</span>',
      "\\arctan": '<span class="math-trig">arctan</span>',
      "\\sinh": '<span class="math-trig">sinh</span>',
      "\\cosh": '<span class="math-trig">cosh</span>',
      "\\tanh": '<span class="math-trig">tanh</span>',
      "\\log": '<span class="math-trig">log</span>',
      "\\ln": '<span class="math-trig">ln</span>',
      "\\exp": '<span class="math-trig">exp</span>',
      "\\lim": '<span class="math-trig">lim</span>',
    }

    let result = text
    for (const [latex, html] of Object.entries(trigFunctions)) {
      result = result.replace(new RegExp(latex.replace(/\\/g, "\\\\"), "g"), html)
    }

    // Handle special case for sin^2(x) notation
    result = result.replace(/(<span class="math-trig">\w+<\/span>)(\d|\^[0-9]|\^\{[^}]+\})\(/, (match, func, power) => {
      return `${func}<sup>${power.startsWith("^") ? power.substring(1) : power}</sup>(`
    })

    return result
  }

  // Format text commands like \text{...}
  const formatText = (text: string): string => {
    return text.replace(/\\text\{([^{}]+)\}/g, (_, content) => {
      return `<span class="math-text">${content}</span>`
    })
  }

  // Format space commands like \, \; \quad etc.
  const formatSpaces = (text: string): string => {
    return text
      .replace(/\\,/g, '<span class="math-space-small"></span>')
      .replace(/\\;/g, '<span class="math-space-medium"></span>')
      .replace(/\\quad/g, '<span class="math-space-large"></span>')
      .replace(/\\qquad/g, '<span class="math-space-xlarge"></span>')
  }

  // Format special commands like \approx, \times, etc.
  const formatSpecialCommands = (text: string): string => {
    // Handle parentheses delimiters $ and $
    return text.replace(/\\$/g, "").replace(/\\$/g, "")
  }

  // Format \left( and \right) for properly sized parentheses
  const formatParentheses = (text: string): string => {
    return text
      .replace(/\\left\(/g, "(")
      .replace(/\\right\)/g, ")")
      .replace(/\\left\[/g, "[")
      .replace(/\\right\]/g, "]")
      .replace(/\\left\\{/g, "{")
      .replace(/\\right\\}/g, "}")
  }

  // Format superscripts and subscripts with better support for complex expressions
  const formatSuperscriptsAndSubscripts = (text: string): string => {
    // Handle superscripts with numbers and expressions
    const result = text
      // Handle superscripts with braces like ^{...}
      .replace(/\^\{([^{}]+|(?:\{[^{}]*\})+)\}/g, (_, content) => {
        return `<sup>${content}</sup>`
      })
      // Handle simple superscripts like ^2
      .replace(/\^([0-9a-zA-Z])/g, (_, digit) => {
        return `<sup>${digit}</sup>`
      })
      // Handle subscripts with braces like _{...}
      .replace(/_\{([^{}]+|(?:\{[^{}]*\})+)\}/g, (_, content) => {
        return `<sub>${content}</sub>`
      })
      // Handle simple subscripts like _2
      .replace(/_([0-9a-zA-Z])/g, (_, digit) => {
        return `<sub>${digit}</sub>`
      })

    return result
  }

  // Format square roots
  const formatSqrt = (text: string): string => {
    // Match \sqrt{content}
    return text.replace(/\\sqrt\{([^{}]+|(?:\{[^{}]*\})+)\}/g, (_, content) => {
      return `<span class="math-sqrt">√<span class="math-sqrt-content">${content}</span></span>`
    })
  }

  // Enhanced fractions formatter
  const formatFractions = (text: string): string => {
    // Match \frac{numerator}{denominator} with more complex content
    let result = text.replace(
      /\\frac\{([^{}]+|(?:\{[^{}]*\})+)\}\{([^{}]+|(?:\{[^{}]*\})+)\}/g,
      (_, numerator, denominator) => {
        return `<div class="math-fraction"><div class="math-numerator">${numerator}</div><div class="math-fraction-line"></div><div class="math-denominator">${denominator}</div></div>`
      },
    )

    // Also handle simple fractions like a/b without \frac command
    result = result.replace(/([a-zA-Z0-9θ]+)\/([a-zA-Z0-9θ]+)/g, (_, numerator, denominator) => {
      return `<div class="math-fraction"><div class="math-numerator">${numerator}</div><div class="math-fraction-line"></div><div class="math-denominator">${denominator}</div></div>`
    })

    return result
  }

  // Format Greek letters
  const formatGreekLetters = (text: string): string => {
    const greekLetters: Record<string, string> = {
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\delta": "δ",
      "\\epsilon": "ε",
      "\\zeta": "ζ",
      "\\eta": "η",
      "\\theta": "θ",
      θ: "θ", // Also handle θ directly
      "\\iota": "ι",
      "\\kappa": "κ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\nu": "ν",
      "\\xi": "ξ",
      "\\omicron": "ο",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\tau": "τ",
      "\\upsilon": "υ",
      "\\phi": "φ",
      "\\chi": "χ",
      "\\psi": "ψ",
      "\\omega": "ω",
      "\\Gamma": "Γ",
      "\\Delta": "Δ",
      "\\Theta": "Θ",
      "\\Lambda": "Λ",
      "\\Xi": "Ξ",
      "\\Pi": "Π",
      "\\Sigma": "Σ",
      "\\Phi": "Φ",
      "\\Psi": "Ψ",
      "\\Omega": "Ω",
    }

    let result = text
    for (const [latex, symbol] of Object.entries(greekLetters)) {
      if (latex.startsWith("\\")) {
        result = result.replace(new RegExp(latex.replace(/\\/g, "\\\\"), "g"), symbol)
      }
    }
    return result
  }

  // Format common math symbols with expanded support
  const formatMathSymbols = (text: string): string => {
    const mathSymbols: Record<string, string> = {
      "\\times": "×",
      "\\div": "÷",
      "\\pm": "±",
      "\\mp": "∓",
      "\\leq": "≤",
      "\\geq": "≥",
      "\\neq": "≠",
      "\\approx": "≈",
      "\\sim": "∼",
      "\\cong": "≅",
      "\\equiv": "≡",
      "\\propto": "∝",
      "\\cdot": "·",
      "\\ldots": "…",
      "\\infty": "∞",
      "\\nabla": "∇",
      "\\partial": "∂",
      "\\sum": "∑",
      "\\prod": "∏",
      "\\int": "∫",
      "\\oint": "∮",
      "\\therefore": "∴",
      "\\because": "∵",
      "\\forall": "∀",
      "\\exists": "∃",
      "\\in": "∈",
      "\\notin": "∉",
      "\\subset": "⊂",
      "\\supset": "⊃",
      "\\cup": "∪",
      "\\cap": "∩",
      "\\emptyset": "∅",
      "\\rightarrow": "→",
      "\\leftarrow": "←",
      "\\Rightarrow": "⇒",
      "\\Leftarrow": "⇐",
      "\\Leftrightarrow": "⇔",
      "\\pi": "π",
      "=": "=",
    }

    let result = text
    for (const [latex, symbol] of Object.entries(mathSymbols)) {
      if (latex.startsWith("\\")) {
        result = result.replace(new RegExp(latex.replace(/\\/g, "\\\\"), "g"), symbol)
      }
    }
    return result
  }

  return (
    <div
      className={`math-renderer ${block ? "math-block" : "math-inline"} ${className}`}
      dangerouslySetInnerHTML={{ __html: processedMath(math) }}
    />
  )
}
