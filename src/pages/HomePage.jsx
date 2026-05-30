import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconSearch, IconSettings, IconStar, IconStarFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PromptCardItem, parsePrompt } from "@/components/prompt-card"
import { AddPromptDialog } from "@/components/add-prompt-dialog"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [prompts, setPrompts] = useState([])
  const [allTags, setAllTags] = useState([])
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <AddPromptDialog onSaved={loadPrompts} allTags={allTags} />
    </div>
  )
}
