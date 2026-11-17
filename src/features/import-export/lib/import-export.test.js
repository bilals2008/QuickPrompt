import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

import { serializeCsv, parseCsv } from "../lib/csv"
import { serializeMarkdown, parseMarkdown } from "../lib/markdown"
import { serializeJson, parseJson } from "../lib/json"
import { resolveFormat, detectFormatFromContent } from "../lib/format-detector"
import { normalizeImportedPrompt, normalizeAllImported } from "../lib/schemas"
import { resolveFolderPath } from "../lib/folder-resolver"
import { FORMATS, exportPrompts, importPrompts, importFromUnknownFormat } from "./index"

const MULTILINE = [
  {
    title: "Code review",
    content: "Review this:\n1. correctness\n2. style",
    tags: "work,ai",
    favorite: 1,
    model: "gpt-4",
    created_at: "2024-01-02T03:04:05.000Z",
    updated_at: "2024-02-03T04:05:06.000Z",
  },
  {
    title: "Simple",
    content: "Just one line",
    tags: "",
    favorite: 0,
    model: "",
    created_at: "2024-03-04T05:06:07.000Z",
    updated_at: "2024-03-04T05:06:07.000Z",
  },
]

describe("csv round-trip", () => {
  it("preserves multi-line content (regression: line-splitting corrupted prompts)", () => {
    const result = parseCsv(serializeCsv(MULTILINE))

    expect(result.ok).toBe(true)
    expect(result.total).toBe(2)
    expect(result.valid).toBe(2)
    expect(result.prompts).toHaveLength(2)
    expect(result.prompts[0].content).toBe("Review this:\n1. correctness\n2. style")
    expect(result.prompts[1].content).toBe("Just one line")
  })

  it("preserves titles, tags, favorite, model and timestamps", () => {
    const [first] = parseCsv(serializeCsv(MULTILINE)).prompts
    expect(first.title).toBe("Code review")
    expect(first.tags).toBe("work,ai")
    expect(first.favorite).toBe(1)
    expect(first.model).toBe("gpt-4")
    expect(first.created_at).toBe("2024-01-02T03:04:05.000Z")
    expect(first.updated_at).toBe("2024-02-03T04:05:06.000Z")
  })

  it("preserves embedded commas, quotes and blank lines", () => {
    const nasty = [{ title: 'He said "hi", ok', content: "a,b\n\n\"quoted\"", tags: "t", favorite: 0 }]
    const [row] = parseCsv(serializeCsv(nasty)).prompts
    expect(row.title).toBe('He said "hi", ok')
    expect(row.content).toBe('a,b\n\n"quoted"')
  })

  it("handles CRLF line endings", () => {
    const crlf = serializeCsv(MULTILINE).replace(/\n/g, "\r\n")
    const result = parseCsv(crlf)
    expect(result.valid).toBe(2)
    expect(result.prompts[0].content).toBe("Review this:\n1. correctness\n2. style")
  })

  it("reports a missing content column", () => {
    const result = parseCsv("title,tags\nHello,work")
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/content/)
  })

  it("rejects a header-only file", () => {
    expect(parseCsv("title,content").ok).toBe(false)
    expect(parseCsv("").ok).toBe(false)
  })

  it("accepts reordered and partial headers", () => {
    const result = parseCsv('content,tags\n"multi\nline",work')
    expect(result.ok).toBe(true)
    expect(result.prompts[0].content).toBe("multi\nline")
    expect(result.prompts[0].tags).toBe("work")
  })

  it("accepts foreign headers such as name/text", () => {
    const result = parseCsv('Name,Text,Favorite\nHello,body text,true')
    expect(result.ok).toBe(true)
    expect(result.prompts[0]).toMatchObject({ title: "Hello", content: "body text", favorite: 1 })
  })
})

describe("markdown round-trip", () => {
  it("keeps a '---' horizontal rule inside prompt content (regression)", () => {
    const prompts = [
      { title: "Divider", content: "Step 1\n---\nStep 2", tags: "a", favorite: 0 },
      { title: "Other", content: "unrelated", tags: "", favorite: 0 },
    ]
    const result = parseMarkdown(serializeMarkdown(prompts))

    expect(result.ok).toBe(true)
    expect(result.prompts).toHaveLength(2)
    expect(result.prompts[0].content).toBe("Step 1\n---\nStep 2")
    expect(result.prompts[1].content).toBe("unrelated")
  })

  it("preserves '#' headings inside prompt content", () => {
    const content = "# Overview\nSome text\n\n## Details\nMore"
    const result = parseMarkdown(serializeMarkdown([{ title: "Doc", content }]))
    expect(result.prompts[0].content).toBe(content)
  })

  it("preserves metadata and timestamps", () => {
    const [first] = parseMarkdown(serializeMarkdown(MULTILINE)).prompts
    expect(first.title).toBe("Code review")
    expect(first.tags).toBe("work,ai")
    expect(first.favorite).toBe(1)
    expect(first.model).toBe("gpt-4")
    expect(first.created_at).toBe("2024-01-02T03:04:05.000Z")
  })

  it("still parses legacy '---' separated files", () => {
    const legacy = ["# One", "", "first body", "", "---", "", "# Two", "", "second body"].join("\n")
    const result = parseMarkdown(legacy)
    expect(result.prompts).toHaveLength(2)
    expect(result.prompts[0].content).toBe("first body")
    expect(result.prompts[1].content).toBe("second body")
  })

  it("does not eat content as frontmatter", () => {
    const md = "# T\n\nbefore\n---\nafter"
    const result = parseMarkdown(md)
    expect(result.prompts[0].content).toBe("before\n---\nafter")
  })

  it("derives a title when none is given", () => {
    const result = parseMarkdown(serializeMarkdown([{ title: "", content: "derive me" }]))
    expect(result.prompts[0].title).toBe("derive me")
  })
})

describe("json round-trip", () => {
  it("preserves every field including model", () => {
    const result = parseJson(serializeJson(MULTILINE))
    expect(result.ok).toBe(true)
    expect(result.prompts).toHaveLength(2)
    expect(result.prompts[0]).toMatchObject({
      title: "Code review",
      content: "Review this:\n1. correctness\n2. style",
      tags: "work,ai",
      favorite: 1,
      model: "gpt-4",
      created_at: "2024-01-02T03:04:05.000Z",
    })
  })

  it("accepts a bare array", () => {
    const result = parseJson('[{"content":"hello"}]')
    expect(result.ok).toBe(true)
    expect(result.prompts[0].content).toBe("hello")
  })

  it("reports invalid syntax", () => {
    expect(parseJson("{oops").ok).toBe(false)
  })

  it("reports an unrecognised shape", () => {
    expect(parseJson('{"items":[]}').ok).toBe(false)
  })
})

describe("format detection", () => {
  it("prefers the filename", () => {
    expect(resolveFormat({ filename: "backup.json", content: "a,b\nc,d" })).toBe("json")
    expect(resolveFormat({ filename: "backup.CSV", content: "" })).toBe("csv")
    expect(resolveFormat({ filename: "notes.markdown", content: "" })).toBe("markdown")
  })

  it("honours an explicit hint", () => {
    expect(resolveFormat({ hint: "csv", filename: "x.json" })).toBe("csv")
  })

  it("falls back to content sniffing", () => {
    expect(detectFormatFromContent('[{"content":"x"}]')).toBe("json")
    expect(detectFormatFromContent("# Title\n\nbody")).toBe("markdown")
    expect(detectFormatFromContent("content,tags\nhello,work")).toBe("csv")
  })

  it("does not guess CSV from a single line of prose", () => {
    expect(detectFormatFromContent("Hello, world")).toBeNull()
  })

  it("returns null for empty or non-string input", () => {
    expect(detectFormatFromContent("")).toBeNull()
    expect(detectFormatFromContent(null)).toBeNull()
  })
})

describe("schemas", () => {
  it("accepts foreign content field aliases", () => {
    for (const key of ["content", "text", "body", "prompt", "instruction", "message", "description"]) {
      expect(normalizeImportedPrompt({ [key]: "hi" }).prompt.content).toBe("hi")
    }
  })

  it("skips rows with no usable content and reports why", () => {
    const { prompts, skipped } = normalizeAllImported([{ content: "keep" }, { title: "no body" }])
    expect(prompts).toHaveLength(1)
    expect(skipped).toHaveLength(1)
    expect(skipped[0].reason).toMatch(/content/i)
  })

  it("coerces favorite and timestamps", () => {
    const { prompt } = normalizeImportedPrompt({ content: "x", favorite: "true", created_at: "2020-01-01" })
    expect(prompt.favorite).toBe(1)
    expect(prompt.created_at.startsWith("2020-01-01")).toBe(true)
  })

  it("rejects non-objects", () => {
    expect(normalizeImportedPrompt(null).prompt).toBeNull()
    expect(normalizeImportedPrompt("nope").prompt).toBeNull()
  })
})

describe("real-world files", () => {
  it("imports a JSON file saved with a UTF-8 BOM", () => {
    const text = `\uFEFF${JSON.stringify({ prompts: [{ title: "T", content: "body" }] })}`
    const result = importFromUnknownFormat({ filename: "backup.json", text })
    expect(result.ok).toBe(true)
    expect(result.prompts[0].content).toBe("body")
  })

  it("imports Excel's semicolon CSV", () => {
    const text = 'title;content;tags\r\nHello;"line one\r\nline two";\r\n'
    const result = parseCsv(text)
    expect(result.ok).toBe(true)
    expect(result.prompts[0]).toMatchObject({ title: "Hello", content: "line one\nline two" })
  })

  it("imports tab separated CSV", () => {
    const result = parseCsv("title\tcontent\nHello\tbody")
    expect(result.prompts[0]).toMatchObject({ title: "Hello", content: "body" })
  })

  it("splits a hand-written markdown file on top-level headings", () => {
    const text = "# One\n\nbody one\n\n## Still one\n\nmore\n\n# Two\n\nbody two"
    const result = parseMarkdown(text)
    expect(result.prompts).toHaveLength(2)
    expect(result.prompts[0].content).toContain("## Still one")
    expect(result.prompts[1].content).toBe("body two")
  })

  it("imports a plain markdown file with no heading as one prompt", () => {
    const result = parseMarkdown("You are a helpful assistant.\nAnswer in one sentence.")
    expect(result.ok).toBe(true)
    expect(result.prompts).toHaveLength(1)
    expect(result.prompts[0].content).toBe("You are a helpful assistant.\nAnswer in one sentence.")
    expect(result.prompts[0].title).toBe("You are a helpful assistant.")
  })

  it("keeps long prompts instead of rejecting the import", () => {
    const content = "x".repeat(20000)
    const result = parseJson(JSON.stringify([{ content }]))
    expect(result.prompts[0].content).toHaveLength(20000)
  })

  it("imports every shipped example file", () => {
    const read = (name) =>
      readFileSync(new URL(`../../../../examples/${name}`, import.meta.url), "utf-8")
    for (const [name, expected] of [
      ["quickprompt-import.md", 2],
      ["quickprompt-import.csv", 2],
      ["quickprompt-import.json", 2],
    ]) {
      const result = importFromUnknownFormat({ filename: name, text: read(name) })
      expect(result.ok, `${name}: ${result.error}`).toBe(true)
      expect(result.prompts, name).toHaveLength(expected)
      expect(result.prompts[0].content, name).toContain("Review this diff")
      expect(result.prompts[0].title, name).toBe("Code review")
      expect(result.prompts[0].folder, name).toBe("Work")
      expect(result.prompts[0].tags, name).toBe("work,dev")
    }
  })
})

describe("folders named in the file", () => {
  it("reads the folder from markdown, json and csv", () => {
    const md = parseMarkdown("# T\n**Folder:** Work\n\nbody")
    expect(md.prompts[0].folder).toBe("Work")

    const json = parseJson('[{"content":"body","folder":"Work"}]')
    expect(json.prompts[0].folder).toBe("Work")

    const csv = parseCsv("content,folder\nbody,Work")
    expect(csv.prompts[0].folder).toBe("Work")
  })

  it("reuses an existing folder and creates a missing one", async () => {
    const folders = [{ id: "f1", name: "Work", parent_id: null }]
    const created = []
    const api = {
      list: async () => folders,
      create: async ({ name, parentId }) => {
        const folder = { id: `new-${name}`, name, parent_id: parentId }
        folders.push(folder)
        created.push(name)
        return folder
      },
    }

    const existing = await resolveFolderPath("work", api)
    expect(existing.id).toBe("f1")
    expect(existing.created).toHaveLength(0)

    const missing = await resolveFolderPath("Ideas", api)
    expect(missing.id).toBe("new-Ideas")
    expect(created).toEqual(["Ideas"])
  })

  it("creates a nested path level by level", async () => {
    const folders = []
    const api = {
      list: async () => folders,
      create: async ({ name, parentId }) => {
        const folder = { id: `${parentId ?? "root"}/${name}`, name, parent_id: parentId }
        folders.push(folder)
        return folder
      },
    }

    const resolved = await resolveFolderPath("Work/Notes", api)
    expect(resolved.created).toEqual(["Work", "Notes"])
    expect(resolved.id).toBe("root/Work/Notes")
  })

  it("does nothing for an empty folder name", async () => {
    const resolved = await resolveFolderPath("  ", { list: async () => [], create: async () => null })
    expect(resolved.id).toBeNull()
  })
})

describe("public entry point", () => {
  it("round-trips every advertised format", () => {
    for (const format of FORMATS) {
      const text = exportPrompts(format.id, MULTILINE)
      const result = importPrompts(format.id, text)

      expect(result.ok, `${format.id} parse failed: ${result.error}`).toBe(true)
      expect(result.prompts, `${format.id} prompt count`).toHaveLength(2)
      expect(result.prompts[0].content, `${format.id} content`).toBe(
        "Review this:\n1. correctness\n2. style",
      )
      expect(result.prompts[0].tags, `${format.id} tags`).toBe("work,ai")
      expect(result.prompts[0].favorite, `${format.id} favorite`).toBe(1)
      expect(result.prompts[0].created_at, `${format.id} created_at`).toBe("2024-01-02T03:04:05.000Z")
    }
  })

  it("auto-detects on import and reports the format used", () => {
    const result = importFromUnknownFormat({
      filename: "backup.json",
      text: exportPrompts("json", MULTILINE),
    })
    expect(result.ok).toBe(true)
    expect(result.format).toBe("json")
    expect(result.prompts).toHaveLength(2)
  })

  it("detects CSV by content when the filename is unhelpful", () => {
    const result = importFromUnknownFormat({
      filename: "download",
      text: exportPrompts("csv", MULTILINE),
    })
    expect(result.ok).toBe(true)
    expect(result.format).toBe("csv")
    expect(result.prompts[0].content).toBe("Review this:\n1. correctness\n2. style")
  })

  it("fails clearly on an unrecognisable file", () => {
    const result = importFromUnknownFormat({ filename: "notes", text: "just some prose" })
    expect(result.ok).toBe(false)
    expect(result.format).toBeNull()
    expect(result.error).toMatch(/detect/i)
  })

  it("throws on an unknown export format", () => {
    expect(() => exportPrompts("xml", [])).toThrow(/Unknown export format/)
  })
})