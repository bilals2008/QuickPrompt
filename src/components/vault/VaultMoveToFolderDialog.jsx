import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FolderGlyph } from "@/components/folders/FolderGlyph"

function buildDepthMap(folders) {
  const byId = {}
  for (const f of folders) byId[f.id] = f
  const depth = {}
  const walk = (folder) => {
    let d = 0
    let current = folder
    while (current?.parent_id && byId[current.parent_id]) {
      d += 1
      current = byId[current.parent_id]
    }
    return d
  }
  for (const f of folders) depth[f.id] = walk(f)
  return depth
}

export function VaultMoveToFolderDialog({
  open,
  onOpenChange,
  folders,
  onSelect,
  currentFolderId = null,
}) {
  const depth = buildDepthMap(folders)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xs">
        <DialogHeader className="border-b border-border/30 px-4 py-3">
          <DialogTitle className="text-sm">Move to folder</DialogTitle>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto py-1">
          {folders.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/60">
              No folders yet. Create one first.
            </p>
          ) : (
            folders.map((folder) => {
              const isCurrent = folder.id === currentFolderId
              return (
                <button
                  key={folder.id}
                  disabled={isCurrent}
                  onClick={() => {
                    onSelect(folder.id)
                    onOpenChange(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors",
                    isCurrent
                      ? "cursor-default opacity-50"
                      : "cursor-pointer hover:bg-accent/50"
                  )}
                  style={{ paddingLeft: `${16 + depth[folder.id] * 14}px` }}
                >
                  <FolderGlyph folder={folder} size={14} />
                  <span className="min-w-0 flex-1 truncate text-xs">{folder.name}</span>
                  {isCurrent && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">Current</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VaultMoveToFolderDialog
