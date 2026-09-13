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
import { IconCheck, IconSearch } from "@tabler/icons-react"

export function AddPromptsDialog({
  open,
  onOpenChange,
  allPrompts,
  folderPrompts,
  search,
  onSearchChange,
  onAdd,
}) {
  const [selected, setSelected] = useState([])
  const folderPromptIds = new Set(folderPrompts.map((p) => p.id))
  const available = allPrompts.filter((p) => !folderPromptIds.has(p.id))
  const filtered = available.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleAdd = () => {
    if (selected.length === 0) return
    onAdd(selected)
    setSelected([])
  }

  useEffect(() => {
    if (!open) {
      setSelected([])
      onSearchChange("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border/30 px-4 py-3">
          <DialogTitle className="text-sm">Add prompts to folder</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-2">
          <div className="relative">
            <IconSearch size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search prompts..."
              className="h-7 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/60">
              {available.length === 0 ? "All prompts already in this folder" : "No matching prompts"}
            </p>
          ) : (
            filtered.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => toggle(prompt.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer",
                  "hover:bg-accent/40",
                  selected.includes(prompt.id) && "bg-primary/10"
                )}
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selected.includes(prompt.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60"
                  )}
                >
                  {selected.includes(prompt.id) && <IconCheck size={10} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{prompt.title || "Untitled"}</p>
                  <p className="truncate text-[10px] text-muted-foreground/60">
                    {prompt.content?.slice(0, 60)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-2.5">
          <p className="text-[10px] text-muted-foreground/60">{selected.length} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" disabled={selected.length === 0} onClick={handleAdd}>
              Add{selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPromptsDialog
