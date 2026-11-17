import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getVaultType } from "@/components/vault-item-dialog"
import { IconCheck, IconPlus, IconSearch } from "@tabler/icons-react"

export function VaultAddItemsDialog({
  open,
  onOpenChange,
  items,
  existingIds = null,
  search,
  onSearchChange,
  onAdd,
  folderName,
}) {
  const [selected, setSelected] = useState(new Set())

  const query = search.trim().toLowerCase()
  const available = existingIds ? items.filter((i) => !existingIds.has(i.id)) : items
  const filtered = available.filter(
    (i) =>
      i.title?.toLowerCase().includes(query) ||
      i.notes?.toLowerCase().includes(query)
  )

  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border/30 px-4 py-3">
          <DialogTitle className="truncate text-sm">
            Add items to {folderName ? `"${folderName}"` : "folder"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2">
          <div className="relative">
            <IconSearch size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search items..."
              className="h-7 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/60">
              {available.length === 0
                ? "All items are already in this folder"
                : "No matching items"}
            </p>
          ) : (
            filtered.map((item) => {
              const type = getVaultType(item.type)
              const TypeIcon = type.icon
              const isSelected = selected.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer",
                    "hover:bg-accent/40",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/60"
                    )}
                  >
                    {isSelected && <IconCheck size={10} />}
                  </div>
                  <TypeIcon size={13} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground/60">{type.label}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/30 px-4 py-2.5">
          <p className="text-[10px] text-muted-foreground/60">{selected.size} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={selected.size === 0}
              onClick={() => onAdd(Array.from(selected))}
            >
              <IconPlus size={12} /> Add{selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VaultAddItemsDialog
