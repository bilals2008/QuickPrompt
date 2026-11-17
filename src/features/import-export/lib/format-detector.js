export function detectFormatFromFilename(filename) {
  if (typeof filename !== "string") return null
  const lower = filename.toLowerCase()
  if (lower.endsWith(".json")) return "json"
  if (lower.endsWith(".csv")) return "csv"
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown"
  return null
}

export function detectFormatFromContent(text) {
  if (typeof text !== "string") return null
  const trimmed = text.trimStart()
  if (!trimmed) return null
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"

  const lines = trimmed.split(/\r?\n/)
  const firstLine = lines[0] || ""
  if (/^---\s*$/.test(firstLine)) return "markdown"
  if (firstLine.startsWith("#")) return "markdown"
  // Only guess CSV when the file looks tabular: a header row naming a content column,
  // plus at least one data row. Prose with a comma is not a CSV.
  if (
    lines.length > 1 &&
    /[,;\t]/.test(firstLine) &&
    /\b(content|text|body|prompt|instruction|message|description)\b/i.test(firstLine)
  ) {
    return "csv"
  }
  return null
}

export function resolveFormat({ filename, content, hint } = {}) {
  if (hint && ["json", "csv", "markdown"].includes(hint)) return hint
  const fromName = detectFormatFromFilename(filename)
  if (fromName) return fromName
  return detectFormatFromContent(content)
}
