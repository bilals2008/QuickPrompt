import { useState } from "react"
import {
  IconCheck,
  IconAlertCircle,
  IconCircleCheck,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { FormatBadge } from "./FormatBadge"

function StatusRow({ icon: Icon, label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "text-primary"
      : tone === "warning"
      ? "text-foreground"
      : tone === "danger"
      ? "text-destructive"
      : "text-muted-foreground"
  return (
    <div className="flex items-center justify-between text-xs">
      <div className={cn("flex items-center gap-1.5", toneClass)}>
        <Icon size={14} stroke={2.2} />
        <span>{label}</span>
      </div>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  )
}

function SkippedDetails({ skipped }) {
  const [open, setOpen] = useState(false)
  if (!skipped || skipped.length === 0) return null

  const MAX_VISIBLE = 5
  const visible = open ? skipped : skipped.slice(0, MAX_VISIBLE)
  const hidden = skipped.length - visible.length

  return (
    <div className="mt-2 rounded-md border border-border/60 bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          {open ? "Hide" : "Show"} reasons
        </span>
        <span className="font-mono">{skipped.length}</span>
      </button>
      {open && (
        <ul className="space-y-1 border-t border-border/60 px-2.5 py-2 text-[11px]">
          {visible.map((entry) => (
            <li key={entry.index} className="flex gap-2">
              <span className="shrink-0 font-mono text-muted-foreground/80">#{entry.index + 1}</span>
              <span className="text-foreground/80">{entry.reason}</span>
            </li>
          ))}
          {hidden > 0 && (
            <li className="text-muted-foreground/80">…and {hidden} more</li>
          )}
        </ul>
      )}
    </div>
  )
}

export function ImportSummary({ result, onCommit, onReset, onImportMore, busy }) {
  if (result.status === "idle") return null

  if (result.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
        <div className="flex items-start gap-2">
          <IconAlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-destructive">Import failed</p>
            <p className="text-xs text-muted-foreground">{result.error}</p>
            {result.filename && (
              <p className="truncate font-mono text-[11px] text-muted-foreground/80">
                {result.filename}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onReset} className="h-7 cursor-pointer text-xs">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (result.status === "preview") {
    const skippedCount = Math.max(0, result.total - result.valid)
    return (
      <div className="rounded-lg border border-border/60 bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-primary" />
            <p className="text-sm font-medium text-foreground">Ready to import</p>
          </div>
          <FormatBadge formatId={result.format} />
        </div>

        <div className="space-y-1.5">
          <StatusRow
            icon={IconCheck}
            label="Valid prompts"
            value={result.valid}
            tone="success"
          />
          {skippedCount > 0 && (
            <StatusRow
              icon={IconAlertCircle}
              label="Skipped (invalid)"
              value={skippedCount}
              tone="warning"
            />
          )}
        </div>

        {skippedCount > 0 && <SkippedDetails skipped={result.skipped} />}

        {result.filename && (
          <>
            <Separator className="my-3" />
            <p className="truncate font-mono text-[11px] text-muted-foreground/80">
              {result.filename}
            </p>
          </>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={busy} className="h-7 cursor-pointer text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={busy || result.valid === 0}
            className="h-7 cursor-pointer text-xs"
          >
            Import {result.valid} prompt{result.valid === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    )
  }

  if (result.status === "done") {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-start gap-2">
          <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">Import complete</p>
            <p className="text-xs text-muted-foreground">
              {result.inserted} added{result.failed > 0 ? `, ${result.failed} failed` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <FormatBadge formatId={result.format} />
          <Button variant="outline" size="sm" onClick={onImportMore} className="h-7 cursor-pointer text-xs">
            Import another file
          </Button>
        </div>
      </div>
    )
  }

  return null
}
