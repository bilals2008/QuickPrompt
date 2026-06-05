import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { IconDownload, IconUpload, IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon size={16} />
          </div>
          <div className="space-y-0.5">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

export default function ImportExportPage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
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
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border/30 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate("/")}
                className="shrink-0 cursor-pointer"
                aria-label="Back to home"
              >
                <IconArrowLeft size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to prompts</TooltipContent>
          </Tooltip>
          {sidebarVisible ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                Import &amp; Export
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Back up your library or move it between machines
              </p>
            </div>
          ) : (
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              Import &amp; Export
            </h1>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
          <Section
            icon={IconUpload}
            title="Import"
            description="Restore from a backup or merge prompts from another tool"
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
            <Separator />
            <ImportSummary
              result={import_.result}
              onCommit={import_.commit}
              onReset={import_.reset}
              onImportMore={import_.reset}
              busy={import_.busy}
            />
          </Section>

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
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground/80">
          Imports always create new prompts — your existing data is untouched. To replace
          the library, export first, then delete prompts you do not want to keep.
        </p>
      </div>
    </div>
  )
}
