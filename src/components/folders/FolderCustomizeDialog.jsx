import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import { FolderAppearancePicker } from "@/components/folders/FolderAppearancePicker"
import { DEFAULT_FOLDER_APPEARANCE, parseAppearance, serializeAppearance, getFolderSize, getFolderPixelSize } from "@/lib/folder-appearance"

/**
 * Edit a folder's name, icon and color. Shared between prompt folders,
 * vault folders and Settings > Folders.
 */
export function FolderCustomizeDialog({
  folder,
  open,
  onOpenChange,
  onSave,
  title = "Customize folder",
}) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState(DEFAULT_FOLDER_APPEARANCE.icon)
  const [color, setColor] = useState(DEFAULT_FOLDER_APPEARANCE.color)
  const [size, setSize] = useState(DEFAULT_FOLDER_APPEARANCE.size)
  const [appearanceStr, setAppearanceStr] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!folder) return
    setName(folder.name || "")
    setIcon(folder.icon || DEFAULT_FOLDER_APPEARANCE.icon)
    setColor(folder.color || "")
    setSize(getFolderSize(folder))
    setAppearanceStr(folder.appearance || "")
  }, [folder])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || !folder) return
    setSaving(true)
    try {
      const existing = parseAppearance(appearanceStr)
      const appearance = serializeAppearance({ ...existing, size })
      await onSave(folder.id, { name: trimmed, icon, color, appearance })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
          <FolderGlyph folder={{ icon, color, appearance: appearanceStr }} size={getFolderPixelSize({ appearance: appearanceStr })} />
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
          size={size}
          appearance={appearanceStr}
          onIconChange={setIcon}
          onColorChange={setColor}
          onSizeChange={setSize}
          onAppearanceChange={setAppearanceStr}
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
