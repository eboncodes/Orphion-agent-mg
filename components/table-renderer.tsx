"use client"
import { cn } from "@/lib/utils"

interface TableRendererProps {
  tableRows: string[]
  className?: string
}

export default function TableRenderer({ tableRows, className }: TableRendererProps) {
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
          <tr className="bg-neutral-800 text-left">
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-2 border border-neutral-700 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/50"}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 border border-neutral-700">
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
