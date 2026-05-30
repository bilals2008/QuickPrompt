import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconCopy, IconPlus, IconTrash, IconX, IconSearch, IconSettings, IconDotsVertical, IconStar, IconStarFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

function PromptCardItem({ prompt, onCopy, onDelete, onToggleFavorite }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    onCopy(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite(prompt.id)
  }

  return (
    <div
      onClick={() => onCopy(prompt.content)}
      className="group flex cursor-pointer flex-col rounded-xl border border-border bg-card transition-all hover:ring-1 hover:ring-primary/30"
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {prompt.content}
          </p>
          <button
            onClick={handleFavorite}
            className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-amber-400"
          >
            {prompt.favorite ? (
              <IconStarFilled size={14} className="text-amber-400" />
            ) : (
              <IconStar size={14} />
            )}
          </button>
        </div>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn("text-[10px] font-normal border", getTagColor(tag))}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="text-[11px] text-muted-foreground">
          {formatTime(prompt.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <IconCopy className="size-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <IconDotsVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(prompt.content) }}>
                <IconCopy className="size-3.5" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(prompt.id) }}>
                <IconTrash className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function formatTime(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function HomePage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [prompts, setPrompts] = useState([])
  const [allTags, setAllTags] = useState([])
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const searchRef = useRef(null)

  const loadPrompts = useCallback(async () => {
    try {
      const data = await window.db.getAllPrompts()
      setPrompts(data || [])
    } catch (err) {
      console.error("Failed to load prompts:", err)
    }
  }, [])

  const loadTags = useCallback(async () => {
    try {
      const data = await window.db.getAllTags()
      setAllTags(data.map((t) => t.name) || [])
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }, [])

  useEffect(() => {
    loadPrompts()
    loadTags()
    window.db?.health?.().then((h) => {
      if (!h.ready) toast.error("Database error: " + (h.error || "unknown"))
    })
  }, [loadPrompts, loadTags])

  useEffect(() => {
    if (!searchOpen) return
    searchRef.current?.focus()
  }, [searchOpen])

  async function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (!t || selectedTags.includes(t)) return
    setSelectedTags([...selectedTags, t])
    if (!allTags.includes(t)) {
      try {
        await window.db.createTag(t)
        setAllTags([...allTags, t])
      } catch (err) {
        console.error("Failed to create tag:", err)
      }
    }
    setTagInput("")
  }

  function removeTag(tag) {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  async function savePrompt() {
    if (!content.trim()) {
      toast.error("Please enter a prompt")
      return
    }
    try {
      await window.db.createPrompt({
        content: content.trim(),
        tags: selectedTags.join(","),
      })
      await loadPrompts()
      setContent("")
      setSelectedTags([])
      setTagInput("")
      setOpen(false)
      toast.success("Prompt saved!")
    } catch (err) {
      const msg = err?.message || String(err)
      toast.error(msg)
      console.error(err)
    }
  }

  function copyPrompt(text) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  async function deletePrompt(id) {
    try {
      await window.db.deletePrompt(id)
      await loadPrompts()
      toast.success("Prompt deleted")
    } catch (err) {
      toast.error("Failed to delete prompt")
      console.error(err)
    }
  }

  async function toggleFavoriteHandler(id) {
    try {
      await window.db.toggleFavorite(id)
      await loadPrompts()
    } catch (err) {
      toast.error("Failed to update favorite")
      console.error(err)
    }
  }

  function parsePrompt(p) {
    return {
      ...p,
      tags: p.tags ? p.tags.split(",").filter(Boolean) : [],
    }
  }

  const filteredPrompts = prompts
    .map(parsePrompt)
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      )
    })
    .filter((p) => (showFavoritesOnly ? p.favorite : true))

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30 gap-3">
        <div className="min-w-0">
          {sidebarVisible ? (
            <>
              <h1 className="text-lg font-semibold text-foreground truncate">QuickPrompt</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">Create, tag, and copy prompts instantly</p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-foreground">{prompts.length}</span>
              <span className="text-xs text-muted-foreground">prompts</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!sidebarVisible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <IconSettings size={16} />
            </Button>
          )}
          {prompts.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 cursor-pointer", showFavoritesOnly && "text-amber-400")}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                {showFavoritesOnly ? <IconStarFilled size={16} /> : <IconStar size={16} />}
              </Button>
              {searchOpen ? (
                <Input
                  ref={searchRef}
                  placeholder="Search prompts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setSearchOpen(false); setSearch("") }
                  }}
                  className="h-9 w-40 text-sm"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                >
                  <IconSearch size={16} />
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">No prompts yet</p>
            <p className="text-sm mt-1">Click the + button to add your first prompt</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPrompts.map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                onCopy={copyPrompt}
                onDelete={deletePrompt}
                onToggleFavorite={toggleFavoriteHandler}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg cursor-pointer"
            size="icon"
          >
            <IconPlus size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Prompt</Label>
              <Textarea
                id="content"
                placeholder="Write your prompt here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  className="flex-1"
                  list="tag-suggestions"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tagInput)}
                  className="cursor-pointer"
                >
                  Add
                </Button>
              </div>
              <datalist id="tag-suggestions">
                {allTags
                  .filter((t) => !selectedTags.includes(t))
                  .map((t) => (
                    <option key={t} value={t} />
                  ))}
              </datalist>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn("text-xs font-normal gap-1 border", getTagColor(tag))}
                    >
                      {tag}
                      <IconX
                        size={12}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={savePrompt} className="w-full cursor-pointer">
              Save Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
