import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconFolderPlus } from "@tabler/icons-react"

/** Radix Select rejects empty-string values, so "no folder" needs a sentinel. */
export const NO_FOLDER = "__none__"

/**
 * Folder picker used by the credential and prompt dialogs. Renders a themed
 * shadcn Select (with each folder's custom icon + color and nested indentation)
 * plus an optional inline "new folder" action.
 */
export function FolderSelect({
  value,
  onChange,
  folders = [],
  onCreate,
  placeholder = "No folder",
  className,
  triggerClassName,
  disabled = false,
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  const selected = folders.find((f) => f.id === value) || null

  const depth = useMemo(() => {
    const byId = {}
    for (const f of folders) byId[f.id] = f
    const map = {}
    for (const f of folders) {
      let d = 0
      let current = f
      while (current?.parent_id && byId[current.parent_id]) {
        d += 1
        current = byId[current.parent_id]
      }
      map[f.id] = d
    }
    return map
  }, [folders])

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || !onCreate) {
      setCreating(false)
      setName("")
      return
    }
    setBusy(true)
    try {
      const created = await onCreate(trimmed)
      const id = typeof created === "string" ? created : created?.id
      if (id) onChange(id)
      setCreating(false)
      setName("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            className={cn("h-8 min-w-0 flex-1 cursor-pointer text-sm", triggerClassName)}
          >
            <SelectValue placeholder={placeholder}>
              <span className="flex min-w-0 items-center gap-1.5">
                {selected ? (
                  <>
                    <FolderGlyph folder={selected} size={13} />
                    <span className="truncate">{selected.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={NO_FOLDER}>
              <span className="text-muted-foreground">{placeholder}</span>
            </SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                <span
                  className="flex min-w-0 items-center gap-1.5"
                  style={{ paddingLeft: `${depth[folder.id] * 12}px` }}
                >
                  <FolderGlyph folder={folder} size={13} />
                  <span className="truncate">{folder.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0 cursor-pointer"
            title="New folder"
            aria-label="New folder"
            onClick={() => setCreating((c) => !c)}
          >
            <IconFolderPlus size={14} />
          </Button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
              if (e.key === "Escape") {
                setCreating(false)
                setName("")
              }
            }}
            placeholder="New folder name"
            className="h-7 flex-1 text-xs"
          />
          <Button
            type="button"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            disabled={busy || !name.trim()}
            onClick={submit}
          >
            {busy ? "Adding..." : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            onClick={() => {
              setCreating(false)
              setName("")
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

export default FolderSelect
