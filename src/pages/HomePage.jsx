import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconSearch, IconSettings, IconStar, IconStarFilled, IconLayoutGrid, IconLayoutList } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PromptCardItem, parsePrompt } from "@/components/prompt-card"
import { AddPromptDialog } from "@/components/add-prompt-dialog"
import { DataPagination } from "@/components/data-pagination"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function HomePage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [prompts, setPrompts] = useState([])
  const [allTags, setAllTags] = useState([])
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [viewMode, setViewMode] = useState("grid")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(!sidebarVisible ? 8 : 16)
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

  const filteredPrompts = useMemo(() => {
    return prompts
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
  }, [prompts, search, showFavoritesOnly])

  const paginatedPrompts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPrompts.slice(start, start + pageSize)
  }, [filteredPrompts, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, showFavoritesOnly, pageSize])

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
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{prompts.length}</span>
                <span className="text-xs text-muted-foreground font-medium">prompts</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? <IconLayoutList size={16} /> : <IconLayoutGrid size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {viewMode === "grid" ? "List view" : "Grid view"}
                </TooltipContent>
              </Tooltip>
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
            <div className="sticky-note sticky-tint-yellow p-6 text-center">
              <p className="text-lg font-semibold text-foreground/80">No prompts yet</p>
              <p className="text-sm mt-2 text-foreground/60">Click the + button to add your first prompt</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className={cn(
            "grid gap-3",
            !sidebarVisible
              ? "grid-cols-1"
              : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {paginatedPrompts.map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                viewMode="grid"
                onCopy={copyPrompt}
                onDelete={deletePrompt}
                onToggleFavorite={toggleFavoriteHandler}
                allTags={allTags}
                mini={!sidebarVisible}
                onSaved={loadPrompts}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {paginatedPrompts.map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                viewMode="list"
                onCopy={copyPrompt}
                onDelete={deletePrompt}
                onToggleFavorite={toggleFavoriteHandler}
                allTags={allTags}
                mini={!sidebarVisible}
                onSaved={loadPrompts}
              />
            ))}
          </div>
        )}

        {filteredPrompts.length > 20 && (
          <div className={cn("mt-4", !sidebarVisible && "px-1")}>
            <DataPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredPrompts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 16, 24, 48]}
              mini={!sidebarVisible}
            />
          </div>
        )}
      </div>

      <AddPromptDialog onSaved={loadPrompts} allTags={allTags} mini={!sidebarVisible} />
    </div>
  )
}
