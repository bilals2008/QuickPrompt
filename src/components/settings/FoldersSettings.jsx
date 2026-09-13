import { useState } from "react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { SectionHeading, SettingGroup, SettingRow } from "@/components/settings/SettingsPrimitives"
import { FolderAppearancePicker } from "@/components/collections/FolderAppearancePicker"
import { FolderCustomizeDialog } from "@/components/collections/FolderCustomizeDialog"
import { FolderGlyph } from "@/components/collections/FolderGlyph"
import { useFolders } from "@/hooks/useFolders"
import { useFolderDisplaySettings } from "@/hooks/useFolderDisplaySettings"
import {
  IconEye,
  IconFolders,
  IconHash,
  IconPalette,
  IconTrash,
} from "@tabler/icons-react"

export function FoldersSettings() {
  const [display, setDisplay] = useFolderDisplaySettings()
  const { folders, byId, updateFolder } = useFolders()
  const [editing, setEditing] = useState(null)

  const handleSaveFolder = async (id, patch) => {
    try {
      await updateFolder(id, patch)
      toast.success("Folder updated")
    } catch {
      toast.error("Failed to update folder")
    }
  }

  return (
    <section>
      <SectionHeading
        icon={IconFolders}
        title="Folders"
        description="Default icon, color and behavior for your folders"
      />

      <div className="space-y-5">
        <SettingGroup title="New folder defaults">
          <div className="py-3">
            <p className="mb-3 text-xs text-muted-foreground">
              Applied automatically whenever you create a folder or subfolder.
            </p>
            <FolderAppearancePicker
              icon={display.defaultIcon}
              color={display.defaultColor}
              onIconChange={(v) => setDisplay({ defaultIcon: v })}
              onColorChange={(v) => setDisplay({ defaultColor: v })}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Display">
          <SettingRow
            icon={IconEye}
            label="Custom icons & colors"
            description="Use each folder's custom icon and color instead of the plain yellow folder"
          >
            <Switch
              checked={Boolean(display.showFolderAppearance)}
              onCheckedChange={(v) => setDisplay({ showFolderAppearance: v })}
              className="cursor-pointer"
            />
          </SettingRow>
          <Separator />
          <SettingRow
            icon={IconHash}
            label="Show item counts"
            description="Display a badge with the number of items in each folder"
          >
            <Switch
              checked={Boolean(display.showItemCounts)}
              onCheckedChange={(v) => setDisplay({ showItemCounts: v })}
              className="cursor-pointer"
            />
          </SettingRow>
          <Separator />
          <SettingRow
            icon={IconTrash}
            label="Confirm before deleting"
            description="Ask for confirmation before deleting a folder and its contents"
          >
            <Switch
              checked={Boolean(display.confirmDelete)}
              onCheckedChange={(v) => setDisplay({ confirmDelete: v })}
              className="cursor-pointer"
            />
          </SettingRow>
        </SettingGroup>

        <SettingGroup title={`Your folders (${folders.length})`}>
          <div className="py-1">
            {folders.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No folders yet. Create one from Collections.
              </p>
            ) : (
              <div className="flex flex-col">
                {folders.map((folder, idx) => (
                  <div key={folder.id}>
                    {idx > 0 && <Separator />}
                    <button
                      onClick={() => setEditing(folder)}
                      className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FolderGlyph folder={folder} size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {folder.name}
                        </p>
                        {folder.parent_id && byId[folder.parent_id] && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            in {byId[folder.parent_id].name}
                          </p>
                        )}
                      </div>
                      <IconPalette size={14} className="shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SettingGroup>
      </div>

      <FolderCustomizeDialog
        folder={editing}
        open={Boolean(editing)}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
        onSave={handleSaveFolder}
      />
    </section>
  )
}

export default FoldersSettings
