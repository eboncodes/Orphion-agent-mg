"use client"
import { cn } from "@/lib/utils"

interface TableRendererProps {
  tableRows: string[]
  className?: string
  theme?: "light" | "dark"
}

export default function TableRenderer({ tableRows, className, theme = "dark" }: TableRendererProps) {
  // Parse the table rows into header and body
  const parseTable = () => {
    if (tableRows.length < 2) return { headers: [], rows: [] }

    // Extract headers from the first row
    const headerRow = tableRows[0]
    const headers = headerRow
      .split("|")
      .filter((cell) => cell.trim() !== "") // Remove empty cells from start/end
      .map((cell) => cell.trim())

    // Skip the separator row (second row)
    // Process data rows
    const rows = tableRows.slice(2).map((row) => {
      return row
        .split("|")
        .filter((cell) => cell.trim() !== "") // Remove empty cells from start/end
        .map((cell) => cell.trim())
    })

    return { headers, rows }
  }

  const { headers, rows } = parseTable()

  // If table is empty or invalid, don't render anything
  if (headers.length === 0 || rows.length === 0) {
    return null
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className={theme === "light" ? "bg-transparent text-left" : "bg-neutral-800 text-left"}>
            {headers.map((header, index) => (
              <th
                key={index}
                className={cn(
                  "px-4 py-2 font-medium",
                  theme === "light"
                    ? "border border-black text-black bg-transparent"
                    : "border border-neutral-700 text-white",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                theme === "light" ? "bg-transparent" : rowIndex % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/50"
              }
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-4 py-2",
                    theme === "light"
                      ? "border border-black text-black bg-transparent"
                      : "border border-neutral-700 text-white",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
