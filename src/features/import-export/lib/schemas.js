const TAG_SEPARATOR = ","

function asString(value, fallback = "") {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value
  return String(value)
}

function asTagsString(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean)
      .join(TAG_SEPARATOR)
  }
  if (typeof value === "string") {
    return value
      .split(TAG_SEPARATOR)
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .join(TAG_SEPARATOR)
  }
  return ""
}

function asFavorite(value) {
  if (value === true || value === 1 || value === "1" || value === "true") return 1
  return 0
}

function asTimestamp(value) {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

function clampContent(value) {
  const text = asString(value).trim()
  return text.length > 0 ? text : null
}

export function normalizeImportedPrompt(raw) {
  if (!raw || typeof raw !== "object") return null
  const content = clampContent(raw.content ?? raw.text ?? raw.body)
  if (!content) return null
  return {
    content,
    tags: asTagsString(raw.tags ?? raw.tag),
    model: asString(raw.model).trim(),
    favorite: asFavorite(raw.favorite ?? raw.isFavorite),
    created_at: asTimestamp(raw.created_at ?? raw.createdAt),
    updated_at: asTimestamp(raw.updated_at ?? raw.updatedAt ?? raw.created_at),
  }
}

export function normalizeAllImported(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows) {
    const prompt = normalizeImportedPrompt(row)
    if (prompt) out.push(prompt)
  }
  return out
}

export function validatePromptForInsert(prompt) {
  const errors = []
  if (!prompt?.content || typeof prompt.content !== "string") {
    errors.push("content is required")
  }
  if (prompt && prompt.content && prompt.content.length > 10000) {
    errors.push("content exceeds 10000 characters")
  }
  return errors
}
