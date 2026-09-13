import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle } from "@tabler/icons-react"

/**
 * Confirmation dialog for bulk folder deletion.
 * Shows selected folder count, cascading delete warning,
 * and an option to also delete folder contents (prompts/vault items).
 */
export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  folderCount = 0,
  subfolderCount = 0,
  onDelete,
}) {
  const [deleteContents, setDeleteContents] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete({ deleteContents })
      onOpenChange(false)
    } finally {
      setDeleting(false)
      setDeleteContents(false)
    }
  }

  const handleClose = () => {
    setDeleteContents(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Delete folders</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold">This action cannot be undone</p>
            <p className="mt-0.5">
              You are about to delete{" "}
              <span className="font-medium">{folderCount}</span>
              {folderCount === 1 ? " folder" : " folders"}
              {subfolderCount > 0 && (
                <>
                  {" "}and{" "}
                  <span className="font-medium">{subfolderCount}</span>
                  {" "}{subfolderCount === 1 ? "subfolder" : "subfolders"}
                </>
              )}
              .
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteContents}
            onChange={(e) => setDeleteContents(e.target.checked)}
            className="mt-0.5 size-3.5 rounded border-border/60 accent-primary cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">
            Also delete all prompts inside these folders
            <span className="block text-[10px] text-muted-foreground/70">
              Prompts will be permanently removed, not just removed from folders
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="cursor-pointer"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : `Delete ${folderCount === 1 ? "folder" : "folders"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkDeleteConfirmDialog
