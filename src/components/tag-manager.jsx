import { useState, useEffect, useRef, useMemo } from "react"
import { IconPlus, IconX, IconCheck, IconTags, IconSearch, IconHash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function TagManager({ selectedTags, onTagsChange, allTags: externalTags }) {
  const [open, setOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState([])
  const [search, setSearch] = useState("")
  const [allTags, setAllTags] = useState(externalTags || [])
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) {
      setLocalSelected([...selectedTags])
      setAllTags(externalTags || [])
      setSearch("")
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [open, externalTags, selectedTags])

  const filteredTags = useMemo(() => {
    if (!search.trim()) return allTags
    const q = search.toLowerCase()
    return allTags.filter((t) => t.includes(q))
  }, [allTags, search])

  const searchTrimmed = search.trim().toLowerCase()
  const willCreate = searchTrimmed && !allTags.includes(searchTrimmed)

  function toggleTag(tag) {
    setLocalSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleKeyDown(e) {
    if (e.key !== "Enter") return
    e.preventDefault()
    const q = searchTrimmed
    if (!q) return

    if (!allTags.includes(q)) {
      try {
        await window.db.createTag(q)
        setAllTags([...allTags, q])
      } catch (err) {
        console.error("Failed to create tag:", err)
      }
    }
    if (!localSelected.includes(q)) {
      setLocalSelected([...localSelected, q])
    }
    setSearch("")
  }

  function applyAndClose() {
    onTagsChange(localSelected)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
          <IconTags size={14} />
          Tags
          {selectedTags.length > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold leading-none tabular-nums text-primary">
              {selectedTags.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Manage Tags</DialogTitle>
          <DialogDescription className="text-xs">
            {localSelected.length === 0
              ? "Pick existing tags or create new ones"
              : `${localSelected.length} tag${localSelected.length === 1 ? "" : "s"} selected`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <IconSearch size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search or create a tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 pl-7 pr-16 text-xs"
          />
          {willCreate && (
            <kbd className="pointer-events-none absolute right-2 top-1/2 inline-flex h-5 -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              <span>↵</span> create
            </kbd>
          )}
        </div>

        <div className="min-h-[12rem]">
          {allTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <IconHash size={16} />
              </div>
              <p className="text-xs font-medium text-foreground">No tags yet</p>
              <p className="text-[11px] text-muted-foreground">Type above and press Enter to create one</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <IconSearch size={16} />
              </div>
              <p className="text-xs font-medium text-foreground">No matches</p>
              <p className="text-[11px] text-muted-foreground">Press Enter to create &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="flex flex-wrap gap-1.5">
                {filteredTags.map((t) => {
                  const isSelected = localSelected.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      aria-pressed={isSelected}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium leading-none transition-all",
                        isSelected
                          ? "border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {isSelected ? (
                        <IconCheck size={10} stroke={2.5} />
                      ) : (
                        <IconPlus size={10} />
                      )}
                      {t}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {localSelected.length > 0 && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Selected · {localSelected.length}
              </p>
              <button
                type="button"
                onClick={() => setLocalSelected([])}
                className="cursor-pointer text-[10px] text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {localSelected.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="h-auto gap-1 rounded-md border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium leading-none text-primary"
                >
                  <IconCheck size={10} stroke={2.5} />
                  {tag}
                  <span
                    role="button"
                    aria-label={`Remove ${tag}`}
                    className="-mr-0.5 cursor-pointer transition-colors hover:text-destructive"
                    onClick={() => toggleTag(tag)}
                  >
                    <IconX size={10} />
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button size="sm" onClick={applyAndClose} className="cursor-pointer gap-1">
            <IconCheck size={12} />
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
