import { cn } from "@/lib/utils"
import { IconChevronRight, IconFiles } from "@tabler/icons-react"

export function FolderBreadcrumb({
  breadcrumb = [],
  activeFolder,
  onHome,
  onNavigate,
  homeIcon: HomeIcon = IconFiles,
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/20 px-3 py-1.5 text-xs scrollbar-none sm:px-4">
      <button
        onClick={onHome}
        className="shrink-0 rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-accent/60 cursor-pointer"
        aria-label="Back to all folders"
      >
        <HomeIcon size={11} />
      </button>
      {breadcrumb.map((b, i) => {
        const isLast = i === breadcrumb.length - 1
        return (
          <span key={b.id} className="flex shrink-0 items-center gap-1">
            <IconChevronRight size={9} className="text-muted-foreground/40" />
            <button
              onClick={() => {
                if (b.id === activeFolder?.id) return
                onNavigate(b)
              }}
              className={cn(
                "max-w-[120px] truncate rounded px-1 py-0.5 transition-colors cursor-pointer",
                isLast
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60"
              )}
            >
              {b.name}
            </button>
          </span>
        )
      })}
    </div>
  )
}

export default FolderBreadcrumb
