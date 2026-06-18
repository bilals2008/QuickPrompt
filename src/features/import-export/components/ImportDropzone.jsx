import { useState } from "react"
import { IconUpload } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { FormatBadge } from "./FormatBadge"

const FILE_INPUT_ID = "import-export-file-input"

export function ImportDropzone({ onFile, busy, currentFormat, currentFilename, error }) {
  const [isOver, setIsOver] = useState(false)

  function handleDrop(event) {
    event.preventDefault()
    setIsOver(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) onFile(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
    setIsOver(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsOver(false)
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={FILE_INPUT_ID}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "group/dropzone relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center transition-colors",
          "hover:border-primary/50 hover:bg-muted/50",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/50",
          isOver && "border-primary bg-primary/10 ring-2 ring-primary/20",
          busy && "pointer-events-none opacity-60"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all",
            "group-hover/dropzone:scale-105 group-hover/dropzone:bg-primary/15",
            isOver && "scale-110 bg-primary/20"
          )}
        >
          <IconUpload size={18} />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {isOver ? "Release to import" : "Drop a file, or click to browse"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            JSON, CSV, or Markdown
          </p>
        </div>
        <input
          id={FILE_INPUT_ID}
          type="file"
          accept=".json,.csv,.md,.markdown,application/json,text/csv,text/markdown"
          onChange={handleInputChange}
          disabled={busy}
          className="sr-only"
        />
      </label>

      {(currentFilename || error) && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate font-medium text-foreground">
              {currentFilename || "Last attempt"}
            </p>
            <p className={cn("truncate text-[11px]", error ? "text-destructive" : "text-muted-foreground")}>
              {error || "File parsed successfully"}
            </p>
          </div>
          {currentFormat && !error && <FormatBadge formatId={currentFormat} />}
        </div>
      )}
    </div>
  )
}
