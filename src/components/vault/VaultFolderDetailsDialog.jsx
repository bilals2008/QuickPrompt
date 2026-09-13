import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FolderGlyph } from "@/components/folders/FolderGlyph"

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
}

export function VaultFolderDetailsDialog({
  folder,
  items = [],
  childFolders = [],
  path = [],
  open,
  onOpenChange,
}) {
  if (!folder) return null

  const parts = []
  if (items.length > 0) parts.push(`${items.length} Item${items.length !== 1 ? "s" : ""}`)
  if (childFolders.length > 0) parts.push(`${childFolders.length} Folder${childFolders.length !== 1 ? "s" : ""}`)
  const contains = parts.length > 0 ? parts.join(", ") : "Empty"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] gap-4 sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FolderGlyph folder={folder} size={18} />
            <span className="truncate">{folder.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          {path.length > 1 && (
            <div className="flex items-start gap-3 py-1">
              <span className="w-20 shrink-0 text-muted-foreground">Path:</span>
              <span className="min-w-0 truncate text-foreground">
                {path.map((p) => p.name).join(" / ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 py-1">
            <span className="w-20 shrink-0 text-muted-foreground">Type:</span>
            <span className="text-foreground">Vault folder</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="w-20 shrink-0 text-muted-foreground">Contains:</span>
            <span className="text-foreground">{contains}</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="w-20 shrink-0 text-muted-foreground">Created:</span>
            <span className="text-foreground">{formatDate(folder.created_at)}</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="w-20 shrink-0 text-muted-foreground">Modified:</span>
            <span className="text-foreground">{formatDate(folder.updated_at)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VaultFolderDetailsDialog
