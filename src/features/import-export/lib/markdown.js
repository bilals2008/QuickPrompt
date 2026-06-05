import { normalizeAllImported } from "./schemas"

function deriveTitle(content) {
  if (!content) return "Untitled"
  const firstLine = content.split(/\r?\n/, 1)[0].trim()
  if (firstLine.length > 80) return `${firstLine.slice(0, 77).trimEnd()}…`
  return firstLine || "Untitled"
}

function resolveTitle(prompt) {
  if (prompt && typeof prompt.title === "string" && prompt.title.trim().length > 0) {
    return prompt.title.trim()
  }
  return deriveTitle(prompt.content)
}

function buildSection(prompt) {
  const lines = []
  const title = resolveTitle(prompt)
  lines.push(`# ${title}`)
  lines.push("")

  const meta = []
  if (prompt.tags) {
    const tags = String(prompt.tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => `\`${tag}\``)
      .join(" ")
    if (tags) meta.push(`**Tags:** ${tags}`)
  }
  if (prompt.model) meta.push(`**Model:** ${prompt.model}`)
  if (prompt.created_at) meta.push(`**Created:** ${prompt.created_at}`)
  if (prompt.favorite) meta.push(`**Favorite:** ⭐`)

  if (meta.length > 0) {
    lines.push(meta.join("  \n"))
    lines.push("")
  }

  lines.push(prompt.content.trim())
  return lines.join("\n")
}

export function serializeMarkdown(prompts) {
  const header = [
    "---",
    `tool: QuickPrompt`,
    `schema: 1`,
    `exported_at: ${new Date().toISOString()}`,
    `count: ${prompts.length}`,
    "---",
    "",
  ].join("\n")

  const sections = prompts.map(buildSection)
  return `${header}\n${sections.join("\n\n---\n\n")}\n`
}

function parseSection(block) {
  const lines = block.split(/\r?\n/)
  const titleLine = lines.shift() || ""
  const titleMatch = titleLine.match(/^#\s+(.+)$/)
  const title = titleMatch ? titleMatch[1].trim() : ""

  const meta = {}
  const bodyLines = []
  let inMeta = true
  for (const line of lines) {
    if (inMeta && line.trim() === "") {
      inMeta = false
      continue
    }
    if (inMeta) {
      const tagsMatch = line.match(/^\*\*Tags:\*\*\s*(.+)$/i)
      const modelMatch = line.match(/^\*\*Model:\*\*\s*(.+)$/i)
      const createdMatch = line.match(/^\*\*Created:\*\*\s*(.+)$/i)
      const favoriteMatch = line.match(/^\*\*Favorite:\*\*\s*(\S+)/i)
      if (tagsMatch) {
        meta.tags = tagsMatch[1]
          .split(/\s+/)
          .map((tag) => tag.replace(/`/g, "").trim())
          .filter(Boolean)
          .join(",")
      } else if (modelMatch) {
        meta.model = modelMatch[1].trim()
      } else if (createdMatch) {
        meta.created_at = createdMatch[1].trim()
      } else if (favoriteMatch) {
        meta.favorite = /star|⭐|true|1/i.test(favoriteMatch[1]) ? 1 : 0
      } else if (line.trim() === "") {
        inMeta = false
      } else {
        bodyLines.push(line)
      }
    } else {
      bodyLines.push(line)
    }
  }

  return {
    title,
    content: bodyLines.join("\n").trim(),
    ...meta,
  }
}

export function parseMarkdown(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: "Markdown file is empty", prompts: [] }
  }

  const stripped = text.replace(/^---[\s\S]*?---\s*/m, "").trim()
  const blocks = stripped.split(/\n\s*---\s*\n/g).map((block) => block.trim()).filter(Boolean)

  if (blocks.length === 0) {
    return { ok: false, error: "No prompt sections found in Markdown", prompts: [] }
  }

  const rows = blocks.map(parseSection).filter((row) => row.content)
  const { prompts, skipped } = normalizeAllImported(rows)
  return { ok: true, prompts, skipped, total: rows.length, valid: prompts.length }
}
