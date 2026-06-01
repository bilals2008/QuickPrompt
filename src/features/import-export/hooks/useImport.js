import { useCallback, useState } from "react"
import { toast } from "sonner"
import { importFromUnknownFormat, getFormat } from "../lib"
import { validatePromptForInsert } from "../lib/schemas"

const INITIAL_RESULT = {
  status: "idle",
  format: null,
  filename: null,
  prompts: [],
  total: 0,
  valid: 0,
  error: null,
  inserted: 0,
  failed: 0,
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
      const errors = parsed.prompts
        .map((prompt, index) => ({ index, errors: validatePromptForInsert(prompt) }))
        .filter((entry) => entry.errors.length > 0)

      if (errors.length > 0) {
        setResult({
          ...INITIAL_RESULT,
          status: "error",
          filename: file.name,
          error: `${errors.length} prompt(s) failed validation`,
        })
        toast.error("Some prompts failed validation")
        return
      }

      setResult({
        ...INITIAL_RESULT,
        status: "preview",
        format: parsed.format,
        filename: file.name,
        prompts: parsed.prompts,
        total: parsed.total,
        valid: parsed.valid,
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

  const openWithDialog = useCallback(async () => {
    if (!window.importExportAPI?.openFile) {
      toast.error("File dialog API is not available")
      return
    }
    setBusy(true)
    try {
      const res = await window.importExportAPI.openFile({})
      if (!res?.success) {
        if (res?.reason !== "canceled") {
          toast.error(res?.error || "Could not open file")
        }
        return
      }
      const parsed = importFromUnknownFormat({
        text: res.content,
        filename: res.filePath,
        hint: res.format,
      })
      if (!parsed.ok) {
        setResult({
          ...INITIAL_RESULT,
          status: "error",
          filename: res.filePath,
          error: parsed.error,
        })
        toast.error(parsed.error || "Import failed")
        return
      }
      setResult({
        ...INITIAL_RESULT,
        status: "preview",
        format: parsed.format,
        filename: res.filePath,
        prompts: parsed.prompts,
        total: parsed.total,
        valid: parsed.valid,
      })
    } catch (err) {
      toast.error(err?.message || "Import failed")
    } finally {
      setBusy(false)
    }
  }, [])

  const commit = useCallback(async () => {
    if (result.status !== "preview" || result.prompts.length === 0) return { success: false }
    setBusy(true)
    let inserted = 0
    let failed = 0
    try {
      for (const prompt of result.prompts) {
        try {
          await window.db.createPrompt({
            content: prompt.content,
            tags: prompt.tags,
            model: prompt.model,
            favorite: prompt.favorite,
          })
          inserted += 1
        } catch {
          failed += 1
        }
      }
      const fmt = getFormat(result.format)
      toast.success(
        failed === 0
          ? `Imported ${inserted} prompt(s) from ${fmt?.label ?? result.format}`
          : `Imported ${inserted} prompt(s); ${failed} failed`,
      )
      setResult((prev) => ({
        ...prev,
        status: "done",
        inserted,
        failed,
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
    openWithDialog,
    commit,
    reset,
  }
}
