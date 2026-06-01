import { serializeJson, parseJson } from "./json"
import { serializeCsv, parseCsv } from "./csv"
import { serializeMarkdown, parseMarkdown } from "./markdown"
import { resolveFormat } from "./format-detector"

export const FORMATS = [
  {
    id: "json",
    label: "JSON",
    description: "Full fidelity. Best for backups and round-trips.",
    extensions: ["json"],
    mime: "application/json",
  },
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet-friendly. Tags comma-separated inside the cell.",
    extensions: ["csv"],
    mime: "text/csv",
  },
  {
    id: "markdown",
    label: "Markdown",
    description: "Human-readable. Each prompt is its own section.",
    extensions: ["md", "markdown"],
    mime: "text/markdown",
  },
]

export function getFormat(id) {
  return FORMATS.find((format) => format.id === id) || null
}

export function getExtension(formatId) {
  const format = getFormat(formatId)
  return format ? format.extensions[0] : "txt"
}

export function exportPrompts(formatId, prompts) {
  const format = getFormat(formatId)
  if (!format) throw new Error(`Unknown export format: ${formatId}`)
  switch (formatId) {
    case "json":
      return serializeJson(prompts)
    case "csv":
      return serializeCsv(prompts)
    case "markdown":
      return serializeMarkdown(prompts)
    default:
      throw new Error(`Serializer not implemented for ${formatId}`)
  }
}

export function importPrompts(formatId, text) {
  const format = getFormat(formatId)
  if (!format) return { ok: false, error: `Unknown import format: ${formatId}`, prompts: [] }
  switch (formatId) {
    case "json":
      return parseJson(text)
    case "csv":
      return parseCsv(text)
    case "markdown":
      return parseMarkdown(text)
    default:
      return { ok: false, error: `Parser not implemented for ${formatId}`, prompts: [] }
  }
}

export function importFromUnknownFormat({ text, filename, hint }) {
  const formatId = resolveFormat({ filename, content: text, hint })
  if (!formatId) {
    return { ok: false, error: "Could not detect file format. Use .json, .csv, or .md", prompts: [], format: null }
  }
  const result = importPrompts(formatId, text)
  return { ...result, format: formatId }
}

export { serializeJson, parseJson, serializeCsv, parseCsv, serializeMarkdown, parseMarkdown, resolveFormat }
