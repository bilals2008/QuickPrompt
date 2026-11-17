import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IconDownload, IconFileExport } from "@tabler/icons-react"
import { FORMATS } from "../lib"
import { FormatBadge } from "./FormatBadge"

export function ExportPanel({ onExport, busy, promptCount }) {
  const [formatId, setFormatId] = useState(FORMATS[0].id)
  const selected = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0]

  function handleExport() {
    onExport(formatId)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Format</label>
          <FormatBadge formatId={formatId} />
        </div>
        <Select value={formatId} onValueChange={setFormatId} disabled={busy}>
          <SelectTrigger className="h-8 w-full cursor-pointer text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((format) => (
              <SelectItem key={format.id} value={format.id} className="cursor-pointer text-xs">
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] leading-snug text-muted-foreground">{selected.description}</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Prompts to export</span>
          <span className="font-mono text-sm font-medium text-foreground">{promptCount}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-muted-foreground">File extension</span>
          <span className="font-mono text-foreground">.{selected.extensions[0]}</span>
        </div>
      </div>

      <Button onClick={handleExport} disabled={busy || promptCount === 0} className="h-8 w-full cursor-pointer text-xs">
        <IconDownload size={14} />
        {busy ? "Exporting…" : `Export as ${selected.label}`}
      </Button>

      <div className="flex items-start gap-2 text-[11px] text-muted-foreground/80">
        <IconFileExport size={12} className="mt-0.5 shrink-0" />
        <span>A save dialog will open so you can pick the destination.</span>
      </div>
    </div>
  )
}
