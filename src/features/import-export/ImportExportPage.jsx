import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { IconDownload, IconUpload, IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import { useImport } from "./hooks/useImport"
import { useExport } from "./hooks/useExport"
import { ImportDropzone } from "./components/ImportDropzone"
import { ImportSummary } from "./components/ImportSummary"
import { ExportPanel } from "./components/ExportPanel"

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
  )
}

export default function ImportExportPage() {
  const navigate = useNavigate()
  useOutletContext()
  const import_ = useImport()
  const exporter = useExport()
  const [promptCount, setPromptCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    window.db.getAllPrompts().then((prompts) => {
      if (!cancelled) setPromptCount(prompts.length)
    })
    return () => {
      cancelled = true
    }
  }, [import_.result.status])

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border/40 bg-card/50 px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8 cursor-pointer shrink-0"
              aria-label="Back to home"
            >
              <IconArrowLeft size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to prompts</TooltipContent>
        </Tooltip>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IconDownload className="size-4 text-muted-foreground" />
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">Import &amp; Export</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl space-y-5 p-4 sm:p-5">
          <Section
            icon={IconUpload}
            title="Import"
            description="Restore from a backup or merge prompts"
          >
            <ImportDropzone
              onFile={import_.parseFile}
              busy={import_.busy}
              currentFormat={
                import_.result.status === "preview" || import_.result.status === "done"
                  ? import_.result.format
                  : null
              }
              currentFilename={
                import_.result.status === "error" ? import_.result.filename : null
              }
              error={import_.result.status === "error" ? import_.result.error : null}
            />
            <ImportSummary
              result={import_.result}
              onCommit={import_.commit}
              onReset={import_.reset}
              onImportMore={import_.reset}
              busy={import_.busy}
            />
          </Section>

          <Separator className="bg-border/40" />

          <Section
            icon={IconDownload}
            title="Export"
            description="Save your prompts to a file you control"
          >
            <ExportPanel
              onExport={exporter.exportToFile}
              busy={exporter.busy}
              promptCount={promptCount}
            />
          </Section>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground/80">
            Imports always create new prompts — your existing data is untouched. To replace
            the library, export first, then delete prompts you do not want to keep.
          </p>
        </div>
      </div>
    </div>
  )
}
