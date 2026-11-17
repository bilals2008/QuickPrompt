import { normalizeAllImported } from "./schemas"

const COLUMNS = ["title", "content", "tags", "favorite", "model", "folder", "created_at", "updated_at"]
// Same aliases the normalizer accepts, so a CSV from another app is not rejected
// merely because it calls the column "text" or "prompt".
const CONTENT_ALIASES = ["content", "text", "body", "prompt", "instruction", "message", "description"]

function escapeCell(value) {
  const str = value === null || value === undefined ? "" : String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Excel writes ";" in locales where "," is the decimal separator, and some exports use tabs.
// Sniff the delimiter from the header row only, so a comma inside prompt content cannot
// change how the file is split.
function detectDelimiter(text) {
  const header = (text.split(/\r?\n/, 1)[0] || "").toLowerCase()
  const candidates = [",", ";", "\t"]
  let best = ","
  let bestCount = 0
  for (const delimiter of candidates) {
    const count = header.split(delimiter).length - 1
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }
  return best
}

// Scans the whole document as a stream of records. Newlines inside quoted fields are
// preserved as part of the field value, so multi-line prompt content survives a round-trip.
// Splitting on /\r?\n/ first (as a naive line-based parser does) corrupts every prompt
// whose content spans more than one line.
function parseCsvRows(text, delimiter) {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else if (char === "\r") {
        // Newlines inside quoted fields are content, but normalise CRLF/CR to \n.
        if (text[i + 1] === "\n") i += 1
        field += "\n"
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ""
    } else if (char === "\r") {
      // CRLF and lone CR are record terminators, not field content.
      continue
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((cells) => cells.length > 1 || (cells[0] ?? "").trim() !== "")
}

export function serializeCsv(prompts) {
  const lines = [COLUMNS.join(",")]
  for (const prompt of prompts) {
    const row = [
      escapeCell(prompt.title ?? ""),
      escapeCell(prompt.content ?? ""),
      escapeCell(prompt.tags ?? ""),
      escapeCell(prompt.favorite ? 1 : 0),
      escapeCell(prompt.model ?? ""),
      escapeCell(prompt.folder ?? ""),
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

  const rows = parseCsvRows(text, detectDelimiter(text))
  if (rows.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one data row", prompts: [] }
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  if (!header.some((name) => CONTENT_ALIASES.includes(name))) {
    return { ok: false, error: "CSV is missing a 'content' column", prompts: [] }
  }

  // Map cells by header name; normalizeImportedPrompt resolves the aliases.
  const records = []
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i]
    const record = {}
    header.forEach((name, index) => {
      if (name) record[name] = cells[index] ?? ""
    })
    records.push(record)
  }

  const { prompts, skipped } = normalizeAllImported(records)
  return { ok: true, prompts, skipped, total: records.length, valid: prompts.length }
}
