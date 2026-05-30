import { useState, useEffect, useRef, useMemo } from "react"
import { IconPlus, IconX, IconCheck, IconTags, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const TAG_COLORS = [
  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "bg-green-500/10 text-green-500 border-green-500/20",
  "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "bg-teal-500/10 text-teal-500 border-teal-500/20",
  "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "bg-rose-500/10 text-rose-500 border-rose-500/20",
]

function getTagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

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

  function toggleTag(tag) {
    setLocalSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleKeyDown(e) {
    if (e.key !== "Enter") return
    e.preventDefault()
    const q = search.trim().toLowerCase()
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
          <IconTags size={14} /> Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">Manage Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="relative">
            <IconSearch size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              placeholder="Search or create..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-6 h-7 text-xs"
            />
          </div>

          <Separator />

          {allTags.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">No tags yet. Type and press Enter.</p>
          ) : filteredTags.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">
              No match. Press Enter to create.
            </p>
          ) : (
            <ScrollArea className="h-48">
              <div className="flex flex-wrap gap-1">
                {filteredTags.map((t) => {
                  const isSelected = localSelected.includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] transition-all leading-none",
                        isSelected
                          ? getTagColor(t)
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {isSelected ? <IconCheck size={10} /> : <IconPlus size={10} />}
                      {t}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {localSelected.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-1">
                {localSelected.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn("text-[11px] font-normal gap-0.5 border leading-none px-1.5 py-0.5 h-auto", getTagColor(tag))}
                  >
                    {tag}
                    <span
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => toggleTag(tag)}
                    >
                      <IconX size={10} />
                    </span>
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-1.5 pt-0">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="cursor-pointer h-7 text-xs px-2">
            Cancel
          </Button>
          <Button size="sm" onClick={applyAndClose} className="cursor-pointer h-7 text-xs px-2 gap-1">
            <IconCheck size={12} /> Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
