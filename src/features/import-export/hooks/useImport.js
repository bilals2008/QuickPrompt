import { useCallback, useState } from "react"
import { toast } from "sonner"
import { importFromUnknownFormat, getFormat } from "../lib"
import { resolveFolderPath } from "../lib/folder-resolver"

const INITIAL_RESULT = {
  status: "idle",
  format: null,
  filename: null,
  prompts: [],
  skipped: [],
  total: 0,
  valid: 0,
  error: null,
  inserted: 0,
  failed: 0,
  folders: [],
  foldersCreated: [],
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

export function useImport() {
  const [result, setResult] = useState(INITIAL_RESULT)
  const [busy, setBusy] = useState(false)

  const parseFile = useCallback(async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const text = await readFileAsText(file)
      const parsed = importFromUnknownFormat({ text, filename: file.name })
      if (!parsed.ok) {
        setResult({
          ...INITIAL_RESULT,
          status: "error",
          filename: file.name,
          error: parsed.error,
        })
        toast.error(parsed.error || "Import failed")
        return
      }

      // A readable file with no usable rows is still a dead end; say so instead of
      // showing a preview with nothing importable.
      if (parsed.prompts.length === 0) {
        setResult({
          ...INITIAL_RESULT,
          status: "error",
          filename: file.name,
          error: "No prompts with content found in this file",
        })
        toast.error("No prompts found in this file")
        return
      }

      setResult({
        ...INITIAL_RESULT,
        status: "preview",
        format: parsed.format,
        filename: file.name,
        prompts: parsed.prompts,
        skipped: parsed.skipped ?? [],
        total: parsed.total,
        valid: parsed.valid,
        folders: [...new Set(parsed.prompts.map((p) => p.folder).filter(Boolean))],
      })
    } catch (err) {
      setResult({
        ...INITIAL_RESULT,
        status: "error",
        filename: file?.name ?? null,
        error: err?.message || "Failed to read file",
      })
      toast.error("Failed to read file")
    } finally {
      setBusy(false)
    }
  }, [])

  const commit = useCallback(async (folderId) => {
    if (result.status !== "preview" || result.prompts.length === 0) return { success: false }
    setBusy(true)
    let inserted = 0
    let failed = 0
    const foldersCreated = []
    try {
      for (const prompt of result.prompts) {
        try {
          const created = await window.db.createPrompt({
            title: prompt.title,
            content: prompt.content,
            tags: prompt.tags,
            favorite: prompt.favorite,
            model: prompt.model,
            created_at: prompt.created_at,
            updated_at: prompt.updated_at,
          })
          // A folder named in the file wins: it is reused when it already exists and
          // created when it does not. Prompts without one go to the chosen folder.
          let targetFolderId = folderId
          if (prompt.folder) {
            const resolved = await resolveFolderPath(prompt.folder, window.folderAPI)
            targetFolderId = resolved.id ?? folderId
            foldersCreated.push(...resolved.created)
          }
          if (targetFolderId && created?.id) {
            await window.folderAPI?.addPrompt(created.id, targetFolderId).catch(() => {})
          }
          inserted += 1
        } catch {
          failed += 1
        }
      }
      const fmt = getFormat(result.format)
      const createdList = [...new Set(foldersCreated)]
      toast.success(
        [
          failed === 0
            ? `Imported ${inserted} prompt(s) from ${fmt?.label ?? result.format}`
            : `Imported ${inserted} prompt(s); ${failed} failed`,
          createdList.length > 0 ? `Created folder${createdList.length === 1 ? "" : "s"} ${createdList.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(". "),
      )
      setResult((prev) => ({
        ...prev,
        status: "done",
        inserted,
        failed,
        foldersCreated: [...new Set(foldersCreated)],
      }))
      return { success: failed === 0, inserted, failed }
    } finally {
      setBusy(false)
    }
  }, [result])

  const reset = useCallback(() => {
    setResult(INITIAL_RESULT)
  }, [])

  return {
    result,
    busy,
    parseFile,
    commit,
    reset,
  }
}
