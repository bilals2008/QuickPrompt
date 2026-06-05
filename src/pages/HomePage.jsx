// File: src/pages/HomePage.jsx
import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconSearch, IconSettings, IconStar, IconStarFilled, IconLayoutGrid, IconLayoutList, IconX, IconArrowsTransferUpDown, IconLoader2, IconArrowDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PromptCardItem } from "@/components/prompt-card"
import { AddPromptDialog } from "@/components/add-prompt-dialog"
import { usePromptLoader } from "@/hooks/usePromptLoader"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PROMPT_PAGE_SIZE = 100

export default function HomePage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [allTags, setAllTags] = useState([])
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [autoCopy, setAutoCopy] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [hasEverHadPrompts, setHasEverHadPrompts] = useState(false)
  const [totalPromptsInDb, setTotalPromptsInDb] = useState(0)
  const searchRef = useRef(null)

  const {
    items: prompts,
    total,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePromptLoader({
    search,
    favoritesOnly: showFavoritesOnly,
    pageSize: PROMPT_PAGE_SIZE,
  })

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

  const loadTags = useCallback(async () => {
    try {
      const data = await window.db.getAllTags()
      setAllTags(data.map((t) => t.name) || [])
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }, [])

  useEffect(() => {
    loadTags()
    window.db?.getAllPrompts?.().then((data) => {
      setTotalPromptsInDb(Array.isArray(data) ? data.length : 0)
    })
    window.db?.health?.().then((h) => {
      if (!h.ready) toast.error("Database error: " + (h.error || "unknown"))
    })

    window.settingsAPI?.get("defaultView", "grid").then((v) => setViewMode(v))
    window.settingsAPI?.get("autoCopy", true).then((v) => setAutoCopy(v))
    window.settingsAPI?.get("notifications", false).then((v) => setNotifications(v))
  }, [loadTags])

  function copyPrompt(text) {
    navigator.clipboard.writeText(text)
    if (notifications) toast.success("Copied to clipboard!")
  }

  async function deletePrompt(id) {
    try {
      await window.db.deletePrompt(id)
      await refresh()
      if (notifications) toast.success("Prompt deleted")
    } catch (err) {
      if (notifications) toast.error("Failed to delete prompt")
      console.error(err)
    }
  }

  async function toggleFavoriteHandler(id) {
    try {
      await window.db.toggleFavorite(id)
      await refresh()
    } catch (err) {
      if (notifications) toast.error("Failed to update favorite")
      console.error(err)
    }
  }

  useEffect(() => {
    if (total > 0) setHasEverHadPrompts(true)
  }, [total])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  const hasActiveFilters = Boolean(search.trim()) || showFavoritesOnly
  const showEmptyState = !initialLoading && prompts.length === 0
  const showNoResults = showEmptyState && hasActiveFilters

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
                <span className="font-normal text-muted-foreground tabular-nums">
                  ({total.toLocaleString()})
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
        {(total > 0 || hasActiveFilters || hasEverHadPrompts) && (
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 cursor-pointer",
                        showFavoritesOnly && "text-amber-400"
                      )}
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      aria-label={showFavoritesOnly ? "Show all prompts" : "Show favorites only"}
                    >
                      {showFavoritesOnly ? (
                        <IconStarFilled size={16} />
                      ) : (
                        <IconStar size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {showFavoritesOnly ? "Showing favorites" : "Show favorites only"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {(totalPromptsInDb > 0 || searchInput) && (
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  setSearchInput("")
                  setSearch("")
                  searchRef.current?.blur()
                }
              }}
              placeholder="Search prompts…"
              className="h-8 w-full min-w-0 border-0 bg-transparent pl-2 pr-1 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent"
            />
            {searchInput ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setSearchInput("")
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
        {error && prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="sticky-note sticky-tint-yellow p-6 text-center">
              <p className="text-lg font-semibold text-foreground/80">Failed to load prompts</p>
              <p className="text-sm mt-2 text-foreground/60">{error.message || "Unknown error"}</p>
              <Button variant="outline" size="sm" className="mt-4 cursor-pointer" onClick={refresh}>
                Try again
              </Button>
            </div>
          </div>
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="sticky-note sticky-tint-yellow p-6 text-center">
              <p className="text-lg font-semibold text-foreground/80">
                {showNoResults ? "No prompts match your search" : "No prompts yet"}
              </p>
              <p className="text-sm mt-2 text-foreground/60">
                {showNoResults
                  ? "Try a different keyword or clear your filters"
                  : "Click the + button to add your first prompt"}
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className={cn(
            "grid gap-3",
            !sidebarVisible
              ? "grid-cols-1"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5"
          )}>
            {prompts.map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                viewMode="grid"
                onCopy={copyPrompt}
                onDelete={deletePrompt}
                onToggleFavorite={toggleFavoriteHandler}
                allTags={allTags}
                mini={!sidebarVisible}
                onSaved={refresh}
                autoCopy={autoCopy}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {prompts.map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                viewMode="list"
                onCopy={copyPrompt}
                onDelete={deletePrompt}
                onToggleFavorite={toggleFavoriteHandler}
                allTags={allTags}
                mini={!sidebarVisible}
                onSaved={refresh}
                autoCopy={autoCopy}
              />
            ))}
          </div>
        )}

        {!showEmptyState && !error && (
          <div className={cn("mt-6 flex flex-col items-center gap-2", !sidebarVisible && "px-1")}>
            {hasMore ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer gap-1.5 px-4 text-xs"
                  onClick={loadMore}
                  disabled={loading}
                  aria-label="Load more prompts"
                >
                  {loading ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : (
                    <IconArrowDown size={14} />
                  )}
                  {loading ? "Loading…" : "Load More"}
                </Button>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Showing {prompts.length.toLocaleString()} of {total.toLocaleString()} prompts
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-px w-12 bg-border/60" />
                <p className="text-xs text-muted-foreground">
                  All {total.toLocaleString()} {total === 1 ? "prompt" : "prompts"} loaded
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <AddPromptDialog onSaved={refresh} allTags={allTags} mini={!sidebarVisible} />
    </div>
  )
}
