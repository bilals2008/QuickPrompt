// File: src/features/import-export/lib/schemas.js
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

function asTitle(value) {
  if (value === null || value === undefined) return ""
  return asString(value).trim()
}

function clampContent(value) {
  const text = asString(value).trim()
  return text.length > 0 ? text : null
}

export function normalizeImportedPrompt(raw) {
  if (!raw || typeof raw !== "object") {
    return { prompt: null, reason: "Row is not an object" }
  }
  const content = clampContent(
    raw.content ?? raw.text ?? raw.body ?? raw.prompt ?? raw.instruction ?? raw.message ?? raw.description,
  )
  if (!content) {
    return { prompt: null, reason: "Missing a content field (tried: content, text, body, prompt, instruction, message, description)" }
  }
  return {
    prompt: {
      title: asTitle(raw.title ?? raw.name ?? raw.heading),
      content,
      tags: asTagsString(raw.tags ?? raw.tag),
      model: asString(raw.model).trim(),
      favorite: asFavorite(raw.favorite ?? raw.isFavorite),
      created_at: asTimestamp(raw.created_at ?? raw.createdAt),
      updated_at: asTimestamp(raw.updated_at ?? raw.updatedAt ?? raw.created_at),
    },
    reason: null,
  }
}

export function normalizeAllImported(rows) {
  if (!Array.isArray(rows)) return { prompts: [], skipped: [] }
  const prompts = []
  const skipped = []
  rows.forEach((row, index) => {
    const result = normalizeImportedPrompt(row)
    if (result.prompt) prompts.push(result.prompt)
    else skipped.push({ index, reason: result.reason })
  })
  return { prompts, skipped }
}

export function validatePromptForInsert(prompt) {
  const errors = []
  if (!prompt?.content || typeof prompt.content !== "string") {
    errors.push("content is required")
  }
  if (prompt && prompt.content && prompt.content.length > 10000) {
    errors.push("content exceeds 10000 characters")
  }
  if (prompt && prompt.title && prompt.title.length > 200) {
    errors.push("title exceeds 200 characters")
  }
  return errors
}
