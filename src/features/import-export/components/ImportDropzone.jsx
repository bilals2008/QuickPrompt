import { useRef, useState } from "react"
import { IconUpload, IconFileImport, IconFolderOpen } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FormatBadge } from "./FormatBadge"

export function ImportDropzone({ onFile, onOpenDialog, busy, currentFormat, currentFilename, error }) {
  const inputRef = useRef(null)
  const [isOver, setIsOver] = useState(false)

  function handleDrop(event) {
    event.preventDefault()
    setIsOver(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) onFile(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
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
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "group/dropzone relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 px-6 py-10 text-center transition-colors",
          isOver && "border-primary bg-primary/5",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform",
            isOver && "scale-110",
          )}
        >
          <IconUpload size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isOver ? "Drop to import" : "Drag a file here"}
          </p>
          <p className="text-xs text-muted-foreground">
            JSON, CSV, or Markdown up to a few MB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="cursor-pointer"
          >
            <IconFileImport size={14} />
            Browse files
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenDialog}
            disabled={busy}
            className="cursor-pointer"
          >
            <IconFolderOpen size={14} />
            Open dialog
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv,.md,.markdown,application/json,text/csv,text/markdown"
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>

      {(currentFilename || error) && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate font-medium text-foreground">
              {currentFilename || "Last attempt"}
            </p>
            <p className={cn("truncate", error ? "text-destructive" : "text-muted-foreground")}>
              {error || "File parsed successfully"}
            </p>
          </div>
          {currentFormat && !error && <FormatBadge formatId={currentFormat} />}
        </div>
      )}
    </div>
  )
}
