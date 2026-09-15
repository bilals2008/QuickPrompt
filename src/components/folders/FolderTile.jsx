import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import { cn } from "@/lib/utils"
import {
  IconCheck,
  IconDotsVertical,
  IconFolderOpen,
  IconFolderPlus,
  IconPalette,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react"

/**
 * A single folder in the grid.
 * - Single click: open the folder
 * - Ctrl/Cmd + click: toggle selection (enters bulk mode)
 * - Shift + click: range select (when in selection mode)
 * - Double click: open the folder
 * - Dropdown menu: extra actions (open, customize, delete, etc.)
 */
export function FolderTile({
  folder,
  index = 0,
  subfolderCount = 0,
  itemCount = 0,
  showCustomAppearance = true,
  showCounts = true,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onOpen,
  onCustomize,
  onDelete,
  onDetails,
  onNewSubfolder,
}) {
  const total = subfolderCount + itemCount

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      onToggleSelect?.(folder.id)
    } else if (selectionMode) {
      onToggleSelect?.(folder.id)
    } else {
      onOpen?.(folder)
    }
  }

  const handleDoubleClick = () => {
    if (!selectionMode) {
      onOpen?.(folder)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (selectionMode) onToggleSelect?.(folder.id)
          else onOpen?.(folder)
        }
      }}
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col items-center rounded-lg border bg-card/50 p-2 pt-3 pb-1.5 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring h-[88px]",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border/30 hover:border-border/60 hover:bg-accent/30 hover:shadow-sm",
        selectionMode && "select-none"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div
          className={cn(
            "absolute top-1 left-1.5 z-20 flex size-4 items-center justify-center rounded border transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-background"
          )}
        >
          {selected && <IconCheck size={10} strokeWidth={3} />}
        </div>
      )}

      {/* Count badge - hide when in selection mode */}
      {!selectionMode && showCounts && total > 0 && (
        <span className="absolute top-1 left-1.5 rounded-full bg-muted/80 px-1 text-[9px] font-medium text-muted-foreground tabular-nums">
          {total}
        </span>
      )}

      {/* Dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="absolute top-1 right-1 z-10 rounded-md p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 group-focus-within:opacity-100 cursor-pointer"
            aria-label={`${folder.name} actions`}
          >
            <IconDotsVertical size={12} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40" onPointerDown={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(folder) }} className="gap-2 text-xs">
            <IconFolderOpen size={12} /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNewSubfolder(folder) }} className="gap-2 text-xs">
            <IconFolderPlus size={12} /> New subfolder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCustomize(folder) }} className="gap-2 text-xs">
            <IconPalette size={12} /> Customize
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDetails(folder) }} className="gap-2 text-xs">
            <IconInfoCircle size={12} /> Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete(folder)
            }}
            className="gap-2 text-xs text-destructive"
          >
            <IconTrash size={12} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-1 items-center justify-center">
        <FolderGlyph
          folder={folder}
          showCustom={showCustomAppearance}
          className="transition-transform duration-200 group-hover:scale-110"
        />
      </div>

      <p className="w-full min-w-0 truncate text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground mt-auto">
        {folder.name}
      </p>
    </div>
  )
}

export default FolderTile
