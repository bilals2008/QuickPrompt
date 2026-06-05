import { normalizeAllImported } from "./schemas"

const SCHEMA_VERSION = 1
const TOOL_NAME = "QuickPrompt"

function buildEnvelope(prompts, { includeRaw = true } = {}) {
  return {
    tool: TOOL_NAME,
    schema: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    count: prompts.length,
    prompts: includeRaw
      ? prompts.map((p) => ({
          title: p.title ?? "",
          content: p.content ?? "",
          tags: p.tags ?? "",
          favorite: p.favorite ? 1 : 0,
          model: p.model ?? "",
          created_at: p.created_at ?? null,
          updated_at: p.updated_at ?? null,
        }))
      : [],
  }
}

export function serializeJson(prompts) {
  return JSON.stringify(buildEnvelope(prompts), null, 2)
}

export function parseJson(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "Invalid JSON syntax", prompts: [] }
  }

  let rawPrompts = []
  if (Array.isArray(data)) {
    rawPrompts = data
  } else if (data && typeof data === "object" && Array.isArray(data.prompts)) {
    rawPrompts = data.prompts
  } else {
    return { ok: false, error: "Expected an array of prompts or an object with a 'prompts' array", prompts: [] }
  }

  const { prompts, skipped } = normalizeAllImported(rawPrompts)
  return { ok: true, prompts, skipped, total: rawPrompts.length, valid: prompts.length }
}
