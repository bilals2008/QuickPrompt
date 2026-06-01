import { IconCheck, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { FormatBadge } from "./FormatBadge"

function StatusRow({ icon: Icon, label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
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

export function ImportSummary({ result, onCommit, onReset, onImportMore, busy }) {
  if (result.status === "idle") return null

  if (result.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
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
          <Button variant="outline" size="sm" onClick={onReset} className="cursor-pointer">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (result.status === "preview") {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-4">
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
          <StatusRow
            icon={IconAlertCircle}
            label="Skipped (invalid)"
            value={Math.max(0, result.total - result.valid)}
            tone={result.total - result.valid > 0 ? "warning" : "default"}
          />
        </div>

        {result.filename && (
          <>
            <Separator className="my-3" />
            <p className="truncate font-mono text-[11px] text-muted-foreground/80">
              {result.filename}
            </p>
          </>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={busy} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onCommit}
            disabled={busy || result.valid === 0}
            className="cursor-pointer"
          >
            Import {result.valid} prompt{result.valid === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    )
  }

  if (result.status === "done") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-start gap-2">
          <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">Import complete</p>
            <p className="text-xs text-muted-foreground">
              {result.inserted} added{result.failed > 0 ? `, ${result.failed} failed` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <FormatBadge formatId={result.format} />
          <Button variant="outline" size="sm" onClick={onImportMore} className="cursor-pointer">
            Import another file
          </Button>
        </div>
      </div>
    )
  }

  return null
}
