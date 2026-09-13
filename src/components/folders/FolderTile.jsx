import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import {
  IconDotsVertical,
  IconFolderOpen,
  IconFolderPlus,
  IconPalette,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react"

/**
 * A single folder in the grid. Double-click (or the menu) opens it, and the
 * menu exposes nested-folder creation plus icon/color customization.
 */
export function FolderTile({
  folder,
  index = 0,
  subfolderCount = 0,
  itemCount = 0,
  showCustomAppearance = true,
  showCounts = true,
  onOpen,
  onCustomize,
  onDelete,
  onDetails,
  onNewSubfolder,
}) {
  const total = subfolderCount + itemCount

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => onOpen(folder)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(folder)
      }}
      className="group relative flex flex-col items-center gap-1 rounded-lg border border-border/30 bg-card/50 p-2 cursor-pointer transition-all duration-200 hover:border-border/60 hover:bg-accent/30 hover:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: "backwards" }}
    >
      {showCounts && total > 0 && (
        <span className="absolute top-1 left-1.5 rounded-full bg-muted/80 px-1 text-[9px] font-medium text-muted-foreground tabular-nums">
          {total}
        </span>
      )}

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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onOpen(folder)} className="gap-2 text-xs">
            <IconFolderOpen size={12} /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewSubfolder(folder)} className="gap-2 text-xs">
            <IconFolderPlus size={12} /> New subfolder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCustomize(folder)} className="gap-2 text-xs">
            <IconPalette size={12} /> Customize
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDetails(folder)} className="gap-2 text-xs">
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

      <FolderGlyph
        folder={folder}
        showCustom={showCustomAppearance}
        size={28}
        className="transition-transform duration-200 group-hover:scale-110"
      />

      <p className="w-full min-w-0 truncate text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {folder.name}
      </p>
    </div>
  )
}

export default FolderTile
