import { useState } from "react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { SectionHeading, SettingGroup, SettingRow } from "@/components/settings/SettingsPrimitives"
import { FolderAppearancePicker } from "@/components/folders/FolderAppearancePicker"
import { FolderCustomizeDialog } from "@/components/folders/FolderCustomizeDialog"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import { useFolders } from "@/hooks/useFolders"
import { useVaultFolders } from "@/hooks/useVaultFolders"
import { useFolderDisplaySettings } from "@/hooks/useFolderDisplaySettings"
import {
  IconEye,
  IconFolders,
  IconHash,
  IconPalette,
  IconTrash,
} from "@tabler/icons-react"

function FolderList({ folders, byId, emptyLabel, onSelect }) {
  if (folders.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex max-h-[240px] flex-col overflow-y-auto pr-1">
      {folders.map((folder, idx) => (
        <div key={folder.id}>
          {idx > 0 && <Separator />}
          <button
            onClick={() => onSelect(folder)}
            className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FolderGlyph folder={folder} size={18} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{folder.name}</p>
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
  )
}

export function FoldersSettings() {
  const [display, setDisplay] = useFolderDisplaySettings()
  const { folders, byId: promptById, updateFolder } = useFolders()
  const {
    folders: vaultFolders,
    byId: vaultById,
    updateFolder: updateVaultFolder,
  } = useVaultFolders()

  const [editingPromptFolder, setEditingPromptFolder] = useState(null)
  const [editingVaultFolder, setEditingVaultFolder] = useState(null)

  const saveFolder = async (updater, id, patch, label) => {
    try {
      await updater(id, patch)
      toast.success(`${label} updated`)
    } catch {
      toast.error(`Failed to update ${label.toLowerCase()}`)
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
              Applied automatically whenever you create a folder or subfolder, in both
              Collections and the Vault.
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

        <SettingGroup title={`Prompt folders (${folders.length})`}>
          <div className="py-1">
            <FolderList
              folders={folders}
              byId={promptById}
              emptyLabel="No prompt folders yet."
              onSelect={setEditingPromptFolder}
            />
          </div>
        </SettingGroup>

        <SettingGroup title={`Vault folders (${vaultFolders.length})`}>
          <div className="py-1">
            <FolderList
              folders={vaultFolders}
              byId={vaultById}
              emptyLabel="No vault folders yet."
              onSelect={setEditingVaultFolder}
            />
          </div>
        </SettingGroup>
      </div>

      <FolderCustomizeDialog
        folder={editingPromptFolder}
        title="Customize prompt folder"
        open={Boolean(editingPromptFolder)}
        onOpenChange={(o) => {
          if (!o) setEditingPromptFolder(null)
        }}
        onSave={(id, patch) => saveFolder(updateFolder, id, patch, "Folder")}
      />

      <FolderCustomizeDialog
        folder={editingVaultFolder}
        title="Customize vault folder"
        open={Boolean(editingVaultFolder)}
        onOpenChange={(o) => {
          if (!o) setEditingVaultFolder(null)
        }}
        onSave={(id, patch) => saveFolder(updateVaultFolder, id, patch, "Vault folder")}
      />
    </section>
  )
}

export default FoldersSettings
