import { normalizeAllImported } from "./schemas"

const COLUMNS = ["content", "tags", "favorite", "model", "created_at", "updated_at"]

function escapeCell(value) {
  const str = value === null || value === undefined ? "" : String(value)
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function unescapeCell(cell) {
  const trimmed = cell.trim()
  if (!trimmed.startsWith("\"")) return trimmed
  let inner = trimmed.slice(1, -1)
  inner = inner.replace(/""/g, "\"")
  return inner
}

function splitCsvLine(line) {
  const cells = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === "\"" && line[i + 1] === "\"") {
        current += "\""
        i += 1
      } else if (char === "\"") {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === "\"") {
      inQuotes = true
    } else if (char === ",") {
      cells.push(current)
      current = ""
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

export function serializeCsv(prompts) {
  const lines = [COLUMNS.join(",")]
  for (const prompt of prompts) {
    const row = [
      escapeCell(prompt.content ?? ""),
      escapeCell(prompt.tags ?? ""),
      escapeCell(prompt.favorite ? 1 : 0),
      escapeCell(prompt.model ?? ""),
      escapeCell(prompt.created_at ?? ""),
      escapeCell(prompt.updated_at ?? ""),
    ]
    lines.push(row.join(","))
  }
  return lines.join("\n")
}

export function parseCsv(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: "CSV file is empty", prompts: [] }
  }

  const rawLines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (rawLines.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one data row", prompts: [] }
  }

  const header = splitCsvLine(rawLines[0]).map((cell) => cell.trim().toLowerCase())
  const columnIndex = COLUMNS.reduce((acc, col) => {
    const idx = header.indexOf(col)
    if (idx !== -1) acc[col] = idx
    return acc
  }, {})

  if (columnIndex.content === undefined) {
    return { ok: false, error: "CSV is missing a 'content' column", prompts: [] }
  }

  const rows = []
  for (let i = 1; i < rawLines.length; i += 1) {
    const cells = splitCsvLine(rawLines[i])
    const row = {}
    for (const col of COLUMNS) {
      const idx = columnIndex[col]
      row[col] = idx !== undefined ? unescapeCell(cells[idx] ?? "") : ""
    }
    rows.push(row)
  }

  const prompts = normalizeAllImported(rows)
  return { ok: true, prompts, total: rows.length, valid: prompts.length }
}
