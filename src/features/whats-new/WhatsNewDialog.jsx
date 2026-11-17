import appIcon from "/icon.png"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GITHUB_RELEASES_URL, SECTION_META } from "@/lib/changelog"
import { cn } from "@/lib/utils"
import { IconArrowUpRight, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"

function formatReleaseDate(date) {
  if (!date) return ""
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function openReleaseNotes(event) {
  if (!window.shellAPI?.openExternal) return
  event.preventDefault()
  window.shellAPI.openExternal(GITHUB_RELEASES_URL).then(
    (result) => {
      if (!result?.success) toast.error("Could not open link")
    },
    () => toast.error("Could not open link")
  )
}

function FeatureRow({ item, index }) {
  const Icon = item.icon
  return (
    <li
      className="flex items-start gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 [animation-fill-mode:both] motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium leading-5 text-foreground">{item.title}</span>
        {item.desc ? (
          <span className="block text-[11px] leading-snug text-muted-foreground">{item.desc}</span>
        ) : null}
      </span>
    </li>
  )
}

function SectionBlock({ section }) {
  const meta = SECTION_META[section.type] ?? SECTION_META.improved
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {meta.label}
        </span>
      </div>
      <ul className="space-y-2">
        {section.items.map((item, index) => (
          <FeatureRow key={item.title} item={item} index={index} />
        ))}
      </ul>
    </div>
  )
}

function ReleaseBlock({ entry, showVersionHeader }) {
  const date = formatReleaseDate(entry.date)
  return (
    <div className="space-y-3">
      {showVersionHeader ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-foreground">v{entry.version}</span>
          <span className="h-px flex-1 bg-border" />
          {date ? <span className="text-[10px] text-muted-foreground">{date}</span> : null}
        </div>
      ) : null}
      {entry.title ? <p className="text-xs font-medium text-foreground/80">{entry.title}</p> : null}
      {entry.sections.map((section) => (
        <SectionBlock key={section.type} section={section} />
      ))}
    </div>
  )
}

export function WhatsNewDialog({ open, onOpenChange, entries, mode, lastSeenVersion }) {
  if (entries.length === 0) return null

  const latest = entries[0]
  const isUpdate = mode === "update"

  let subtitle = `Welcome to QuickPrompt v${latest.version}`
  if (isUpdate) {
    subtitle = lastSeenVersion ? `Updated from v${lastSeenVersion}` : "Catch up on the latest releases"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 pr-10">
          <img src={appIcon} alt="" className="size-9 shrink-0 rounded-xl ring-1 ring-foreground/10" />
          <div className="min-w-0 flex-1">
            <DialogTitle className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              What&apos;s new
              <Badge variant="secondary" className="h-4 rounded-md px-1.5 text-[10px] font-semibold tabular-nums">
                v{latest.version}
              </Badge>
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">{subtitle}</DialogDescription>
          </div>
        </div>

        <div className="max-h-[52vh] overflow-y-auto scrollbar-thin border-t px-5 py-4">
          <div className="space-y-5">
            {entries.map((entry) => (
              <ReleaseBlock key={entry.version} entry={entry} showVersionHeader={entries.length > 1} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3">
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openReleaseNotes}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Full changelog
            <IconArrowUpRight className="size-3" />
          </a>
          <Button size="sm" className="gap-1.5" onClick={() => onOpenChange(false)}>
            <IconCheck className="size-3.5" />
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
