import { normalizeAllImported } from "./schemas"

// An HTML comment renders as nothing in Markdown, so it keeps the exported file
// human-readable while giving the parser a delimiter that cannot collide with
// prompt content. "---" is a valid horizontal rule, so it must not be used here.
const SECTION_MARKER = "<!-- quickprompt:section -->"
const MARKER_SPLIT = /\n\s*<!--\s*quickprompt:section\s*-->\s*\n/
// Files written by older versions separated sections with "---". Require a following
// heading so a "---" that is merely a horizontal rule inside prompt content is kept.
const LEGACY_SPLIT = /\n[ \t]*---[ \t]*\r?\n(?=\s*#[ \t])/
// Hand-written files have no separators; each top-level "# " heading starts a prompt.
// Only a single "#" splits, so "##" subheadings stay inside the prompt body.
const HEADING_SPLIT = /\n(?=#[ \t])/

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
  if (prompt.folder) meta.push(`**Folder:** ${prompt.folder}`)
  if (prompt.created_at) meta.push(`**Created:** ${prompt.created_at}`)
  if (prompt.favorite) meta.push(`**Favorite:** yes`)

  // parseSection expects metadata directly after the title, then a blank line.
  if (meta.length > 0) {
    lines.push(meta.join("  \n"))
    lines.push("")
  }

  lines.push(String(prompt.content ?? "").trim())
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
  return `${header}\n${sections.join(`\n\n${SECTION_MARKER}\n\n`)}\n`
}

function parseSection(block) {
  const lines = block.split(/\r?\n/)
  const titleMatch = (lines[0] || "").match(/^#\s+(.+)$/)
  const title = titleMatch ? titleMatch[1].trim() : ""
  // A plain text file has no heading; keep its first line as body instead of dropping it.
  if (titleMatch) lines.shift()

  // Older exports put a blank line between the title and the metadata; tolerate it.
  if (lines.length > 0 && lines[0].trim() === "") lines.shift()

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
      const folderMatch = line.match(/^\*\*Folder:\*\*\s*(.+)$/i)
      const createdMatch = line.match(/^\*\*Created:\*\*\s*(.+)$/i)
      const favoriteMatch = line.match(/^\*\*Favorite:\*\*\s*(\S+)/i)
      if (tagsMatch) {
        const raw = tagsMatch[1]
        const parts = raw.includes("`")
          ? (raw.match(/`([^`]*)`/g) || []).map((t) => t.replace(/`/g, ""))
          : raw.split(/\s+/)
        meta.tags = parts.map((t) => t.trim()).filter(Boolean).join(",")
      } else if (modelMatch) {
        meta.model = modelMatch[1].trim()
      } else if (folderMatch) {
        meta.folder = folderMatch[1].trim()
      } else if (createdMatch) {
        meta.created_at = createdMatch[1].trim()
      } else if (favoriteMatch) {
        meta.favorite = /star|yes|true|1/i.test(favoriteMatch[1]) ? 1 : 0
      } else {
        bodyLines.push(line)
        inMeta = false
      }
    } else {
      bodyLines.push(line)
    }
  }

  const content = bodyLines.join("\n").trim()
  return {
    title: title || deriveTitle(content),
    content,
    ...meta,
  }
}

// Only strips frontmatter that actually anchors at the very start of the document.
// A loose /^---[\s\S]*?---/m match would happily eat a "---" inside prompt content.
const FRONTMATTER = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/

function splitFrontmatter(text) {
  const match = text.match(FRONTMATTER)
  if (!match) return { body: text, isOwnExport: false }
  // QuickPrompt writes "tool: QuickPrompt". Our own single-prompt export has no section
  // marker, so it must not be split on headings inside its own content.
  return { body: text.slice(match[0].length), isOwnExport: /^\s*tool:\s*QuickPrompt\s*$/im.test(match[0]) }
}

export function parseMarkdown(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { ok: false, error: "Markdown file is empty", prompts: [] }
  }

  const { body, isOwnExport } = splitFrontmatter(text)
  const stripped = body.trim()
  // Our own exports carry the section marker; older exports used "---"; our own
  // single-prompt export is one section; anything else is a hand-written file where
  // each "# " heading starts a new prompt.
  const splitter = stripped.includes(SECTION_MARKER)
    ? MARKER_SPLIT
    : LEGACY_SPLIT.test(stripped)
      ? LEGACY_SPLIT
      : isOwnExport
        ? null
        : HEADING_SPLIT
  const blocks = (splitter ? stripped.split(splitter) : [stripped])
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return { ok: false, error: "No prompt sections found in Markdown", prompts: [] }
  }

  const rows = blocks.map(parseSection).filter((row) => row.content)
  const { prompts, skipped } = normalizeAllImported(rows)
  return { ok: true, prompts, skipped, total: rows.length, valid: prompts.length }
}
