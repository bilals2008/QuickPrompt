import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderGlyph } from "@/components/collections/FolderGlyph"
import { FolderAppearancePicker } from "@/components/collections/FolderAppearancePicker"
import { DEFAULT_FOLDER_APPEARANCE } from "@/lib/folder-appearance"

/**
 * Edit a folder's name, icon and color. Shared between the Collections page
 * and Settings > Folders.
 */
export function FolderCustomizeDialog({ folder, open, onOpenChange, onSave }) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState(DEFAULT_FOLDER_APPEARANCE.icon)
  const [color, setColor] = useState(DEFAULT_FOLDER_APPEARANCE.color)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!folder) return
    setName(folder.name || "")
    setIcon(folder.icon || DEFAULT_FOLDER_APPEARANCE.icon)
    setColor(folder.color || "")
  }, [folder])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || !folder) return
    setSaving(true)
    try {
      await onSave(folder.id, { name: trimmed, icon, color })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Customize folder</DialogTitle>
        </DialogHeader>

        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
          <FolderGlyph folder={{ icon, color }} size={26} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {name.trim() || "Untitled folder"}
            </p>
            <p className="text-[11px] text-muted-foreground">Preview</p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") onOpenChange(false)
            }}
            placeholder="Folder name"
            className="h-8 text-xs"
            autoFocus
          />
        </div>

        <FolderAppearancePicker
          icon={icon}
          color={color}
          onIconChange={setIcon}
          onColorChange={setColor}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="cursor-pointer"
            disabled={!name.trim() || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FolderCustomizeDialog
