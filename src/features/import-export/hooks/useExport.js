import { useCallback, useState } from "react"
import { toast } from "sonner"
import { exportPrompts, getExtension } from "../lib"
import { api } from "@/lib/api"

function defaultFileName(formatId) {
  const date = new Date().toISOString().slice(0, 10)
  return `quickprompts-${date}.${getExtension(formatId)}`
}

export function useExport() {
  const [busy, setBusy] = useState(false)

  const exportToFile = useCallback(async (formatId) => {
    if (!formatId) return { success: false, reason: "no-format" }
    if (!api.importExport?.saveFile) {
      toast.error("File save API is not available")
      return { success: false, reason: "no-api" }
    }
    setBusy(true)
    try {
      const prompts = await api.prompts.getAllPrompts()
      const content = exportPrompts(formatId, prompts)
      const res = await api.importExport.saveFile({
        content,
        format: formatId,
        suggestedName: defaultFileName(formatId),
      })
      if (!res?.success) {
        if (res?.reason !== "canceled") {
          toast.error(res?.error || "Export failed")
        }
        return res
      }
      toast.success(`Exported ${prompts.length} prompt(s)`)
      return res
    } catch (err) {
      toast.error(err?.message || "Export failed")
      return { success: false, reason: "exception" }
    } finally {
      setBusy(false)
    }
  }, [])

  return { exportToFile, busy }
}
