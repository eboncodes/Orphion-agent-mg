// Function to get language name from code block language identifier
export function getLanguageName(lang: string): string {
  const languageMap: Record<string, string> = {
    js: "JavaScript",
    jsx: "React JSX",
    ts: "TypeScript",
    tsx: "React TSX",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    py: "Python",
    rb: "Ruby",
    java: "Java",
    go: "Go",
    rust: "Rust",
    c: "C",
    cpp: "C++",
    cs: "C#",
    php: "PHP",
    swift: "Swift",
    kotlin: "Kotlin",
    sql: "SQL",
    sh: "Shell",
    bash: "Bash",
    yaml: "YAML",
    md: "Markdown",
  }

  return languageMap[lang.toLowerCase()] || lang.toUpperCase()
}

// Function to copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error("Failed to copy text:", err)
    return false
  }
}
