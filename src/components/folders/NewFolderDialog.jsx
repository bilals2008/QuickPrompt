import { useEffect, useMemo, useState } from "react"
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
import { DEFAULT_FOLDER_APPEARANCE } from "@/lib/folder-appearance"

/**
 * Generate a Windows-style unique folder name.
 * If "New Folder" doesn't exist, use it. Otherwise try "New Folder (1)",
 * "New Folder (2)", etc.
 */
function generateUniqueName(baseName, existingNames) {
  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()))
  if (!existingSet.has(baseName.toLowerCase())) return baseName
  let i = 1
  while (existingSet.has(`${baseName} (${i})`.toLowerCase())) i++
  return `${baseName} (${i})`
}

/**
 * Dialog for creating a new folder with name, icon and color pickers.
 * Replaces the inline NewFolderInput for a cleaner Windows-style UX.
 */
export function NewFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  parentId = null,
  existingFolders = [],
  defaultIcon = DEFAULT_FOLDER_APPEARANCE.icon,
  defaultColor = DEFAULT_FOLDER_APPEARANCE.color,
  isSubfolder = false,
}) {
  const siblingNames = useMemo(() => {
    return existingFolders
      .filter((f) => (parentId ? f.parent_id === parentId : !f.parent_id))
      .map((f) => f.name)
  }, [existingFolders, parentId])

  const autoName = useMemo(
    () => generateUniqueName(isSubfolder ? "New Subfolder" : "New Folder", siblingNames),
    [siblingNames, isSubfolder]
  )

  const [name, setName] = useState(autoName)
  const [icon, setIcon] = useState(defaultIcon)
  const [color, setColor] = useState(defaultColor)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const fresh = generateUniqueName(isSubfolder ? "New Subfolder" : "New Folder", siblingNames)
      setName(fresh)
      setIcon(defaultIcon)
      setColor(defaultColor)
    }
  }, [open, siblingNames, defaultIcon, defaultColor, isSubfolder])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onSubmit({ name: trimmed, icon, color })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isSubfolder ? "New subfolder" : "New folder"}
          </DialogTitle>
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
            selectOnFocus
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
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewFolderDialog
