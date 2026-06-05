// File: src/pages/HomePage.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconSearch, IconSettings, IconStar, IconStarFilled, IconLayoutGrid, IconLayoutList, IconX, IconArrowsTransferUpDown } from "@tabler/icons-react"
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
  const [viewMode, setViewMode] = useState("grid")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(!sidebarVisible ? 8 : 20)
  const [autoCopy, setAutoCopy] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase()
        const isEditable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          e.target?.isContentEditable
        if (!isEditable) {
          e.preventDefault()
          searchRef.current?.focus()
          searchRef.current?.select?.()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

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

    window.settingsAPI?.get("defaultView", "grid").then((v) => setViewMode(v))
    window.settingsAPI?.get("autoCopy", true).then((v) => setAutoCopy(v))
    window.settingsAPI?.get("notifications", false).then((v) => setNotifications(v))
  }, [loadPrompts, loadTags])

  function copyPrompt(text) {
    navigator.clipboard.writeText(text)
    if (notifications) toast.success("Copied to clipboard!")
  }

  async function deletePrompt(id) {
    try {
      await window.db.deletePrompt(id)
      await loadPrompts()
      if (notifications) toast.success("Prompt deleted")
    } catch (err) {
      if (notifications) toast.error("Failed to delete prompt")
      console.error(err)
    }
  }

  async function toggleFavoriteHandler(id) {
    try {
      await window.db.toggleFavorite(id)
      await loadPrompts()
    } catch (err) {
      if (notifications) toast.error("Failed to update favorite")
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
      <header className="border-b border-border/30 px-6 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {sidebarVisible ? (
              <>
                <h1 className="truncate text-lg font-semibold text-foreground tracking-tight">
                  QuickPrompt
                </h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Create, tag, and copy prompts instantly
                </p>
              </>
            ) : (
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                Prompts{" "}
                <span className="font-normal text-muted-foreground">
                  ({prompts.length})
                </span>
              </h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!sidebarVisible && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                    onClick={() => navigate("/import-export")}
                    aria-label="Import / Export"
                  >
                    <IconArrowsTransferUpDown size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Import / Export</TooltipContent>
              </Tooltip>
            )}
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
                      onClick={() => {
                        const newMode = viewMode === "grid" ? "list" : "grid"
                        setViewMode(newMode)
                        window.settingsAPI?.set("defaultView", newMode)
                      }}
                    >
                      {viewMode === "grid" ? (
                        <IconLayoutList size={16} />
                      ) : (
                        <IconLayoutGrid size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {viewMode === "grid" ? "List view" : "Grid view"}
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 cursor-pointer",
                    showFavoritesOnly && "text-amber-400"
                  )}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  {showFavoritesOnly ? (
                    <IconStarFilled size={16} />
                  ) : (
                    <IconStar size={16} />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {prompts.length > 0 && (
          <div
            className={cn(
              "group/search relative flex h-9 w-full items-center rounded-lg border border-border bg-background/60",
              "transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40"
            )}
          >
            <IconSearch
              size={14}
              stroke={2.2}
              className="ml-3 shrink-0 text-muted-foreground"
            />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  setSearch("")
                  searchRef.current?.blur()
                }
              }}
              placeholder="Search prompts…"
              className="h-8 w-full min-w-0 border-0 bg-transparent pl-2 pr-1 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent"
            />
            {search ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setSearch("")
                  searchRef.current?.focus()
                }}
                className="mr-1.5 size-6 cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <IconX size={12} stroke={2.4} />
              </Button>
            ) : (
              <kbd className="mr-2.5 hidden h-5 select-none items-center rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                /
              </kbd>
            )}
          </div>
        )}
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
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5"
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
                autoCopy={autoCopy}
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
                autoCopy={autoCopy}
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
              pageSizeOptions={[8, 16, 20, 25, 48]}
              mini={!sidebarVisible}
            />
          </div>
        )}
      </div>

      <AddPromptDialog onSaved={loadPrompts} allTags={allTags} mini={!sidebarVisible} />
    </div>
  )
}
