import { useState } from "react"
import { IconDownload, IconFileDescription } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FORMATS, exportPrompts, getExtension } from "../lib"

// Rendered through the real serializers, so the example can never drift from the format.
const SAMPLE_PROMPTS = [
  {
    title: "Code review",
    content: "Review this diff for:\n\n1. correctness\n2. readability",
    tags: "work,dev",
    favorite: 1,
    model: "gpt-4o",
    folder: "Work",
  },
  {
    title: "Summarise notes",
    content: "Summarise the notes below in five bullets.",
    tags: "writing",
    favorite: 0,
    model: "",
    folder: "Personal",
  },
]

const HINTS = {
  markdown:
    "Every top-level # heading starts a new prompt. A **Folder:** line puts the prompt in that folder; a missing one is created.",
  json: "An array of prompt objects, or an object with a prompts array. A folder field works the same way.",
  csv: "The header row needs a content column. Other columns are optional; a folder column works the same way.",
}

export function FormatExample() {
  const [formatId, setFormatId] = useState("markdown")
  const sample = exportPrompts(formatId, SAMPLE_PROMPTS)

  async function handleSaveExample() {
    const res = await window.importExportAPI?.saveFile({
      content: sample,
      format: formatId,
      suggestedName: `quickprompt-example.${getExtension(formatId)}`,
    })
    if (res?.success) toast.success("Example file saved")
    else if (res && res.reason !== "canceled") toast.error(res.error || "Could not save example")
  }

  return (
    <details className="group rounded-lg border border-border/60 bg-muted/20">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-foreground">
        <IconFileDescription size={14} className="text-muted-foreground" />
        What should the file look like?
      </summary>

      <div className="space-y-2 border-t border-border/60 p-3">
        <div className="flex gap-1.5" role="group" aria-label="Example format">
          {FORMATS.map((format) => (
            <Button
              key={format.id}
              type="button"
              size="sm"
              variant={format.id === formatId ? "secondary" : "ghost"}
              aria-pressed={format.id === formatId}
              onClick={() => setFormatId(format.id)}
              className="h-6 cursor-pointer px-2 text-[11px]"
            >
              {format.label}
            </Button>
          ))}
        </div>

        <pre className="max-h-56 overflow-auto whitespace-pre rounded-md border border-border/60 bg-card p-2.5 font-mono text-[10px] leading-relaxed text-foreground/80">
          {sample}
        </pre>

        <p className="text-[11px] leading-snug text-muted-foreground">{HINTS[formatId]}</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveExample}
          className="h-7 cursor-pointer text-xs"
        >
          <IconDownload size={12} />
          Save example file
        </Button>
      </div>
    </details>
  )
}
