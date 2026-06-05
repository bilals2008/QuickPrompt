// File: src/lib/tag-utils.js
const TAG_SEPARATORS = /[,\s;\\/|+]+/

export function parseTagsString(value) {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(TAG_SEPARATORS)
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

export function splitTagInput(value) {
  if (typeof value !== "string" || value.length === 0) {
    return { completeTags: [], remaining: "" }
  }
  const endsWithSep = /[,\s;\\/|+]$/.test(value)
  const parts = value
    .split(TAG_SEPARATORS)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)

  if (parts.length === 0) {
    return { completeTags: [], remaining: endsWithSep ? "" : value }
  }
  if (endsWithSep) {
    return { completeTags: parts, remaining: "" }
  }
  return { completeTags: parts.slice(0, -1), remaining: parts[parts.length - 1] || "" }
}
