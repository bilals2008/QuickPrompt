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
  if (/^---\s*$/.test(trimmed.split("\n", 1)[0] || "")) return "markdown"
  if (trimmed.startsWith("#")) return "markdown"
  if (/^content,|content\t/.test(trimmed.split("\n", 1)[0] || "")) return "csv"
  if (trimmed.includes(",")) return "csv"
  return null
}

export function resolveFormat({ filename, content, hint } = {}) {
  if (hint && ["json", "csv", "markdown"].includes(hint)) return hint
  const fromName = detectFormatFromFilename(filename)
  if (fromName) return fromName
  return detectFormatFromContent(content)
}
