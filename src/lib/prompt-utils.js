const DEFAULT_TITLE = "Untitled prompt"
const MAX_DERIVED_LENGTH = 60

export function deriveTitleFromContent(content) {
  if (typeof content !== "string" || content.length === 0) return DEFAULT_TITLE
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) || ""
  if (!firstLine) return DEFAULT_TITLE
  if (firstLine.length > MAX_DERIVED_LENGTH) {
    return `${firstLine.slice(0, MAX_DERIVED_LENGTH).trimEnd()}\u2026`
  }
  return firstLine
}

export function getPromptTitle(prompt) {
  if (!prompt || typeof prompt !== "object") return DEFAULT_TITLE
  const stored = typeof prompt.title === "string" ? prompt.title.trim() : ""
  if (stored) return stored
  return deriveTitleFromContent(prompt.content)
}

export function isExplicitTitle(prompt) {
  if (!prompt || typeof prompt !== "object") return false
  return typeof prompt.title === "string" && prompt.title.trim().length > 0
}
