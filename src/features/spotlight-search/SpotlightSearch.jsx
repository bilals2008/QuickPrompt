import { useState, useEffect, useMemo } from "react"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  IconFileText,
  IconClipboard,
  IconCommand,
  IconCornerDownLeft,
  IconStarFilled,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function getPromptTitle(content) {
  if (!content) return "Untitled"
  const firstLine = content.split("\n").find((l) => l.trim().length > 0) || ""
  const trimmed = firstLine.trim()
  if (!trimmed) return "Untitled"
  return trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed
}

function parseTags(tags) {
  if (!tags) return []
  return tags.split(",").map((t) => t.trim().split(":")[0]).filter(Boolean)
}

function useIsMini(breakpoint = 640) {
  const [isMini, setIsMini] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const onResize = () => setIsMini(window.innerWidth < breakpoint)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [breakpoint])
  return isMini
}

export function SpotlightSearch() {
  const [open, setOpen] = useState(false)
  const [prompts, setPrompts] = useState([])
  const isMini = useIsMini()

  useEffect(() => {
    if (!window.electronAPI?.onGlobalSearch) return
    const unsubscribe = window.electronAPI.onGlobalSearch(() => {
      setOpen((prev) => !prev)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const onOpenSpotlight = () => setOpen(true)
    window.addEventListener("qp:open-spotlight", onOpenSpotlight)
    return () => window.removeEventListener("qp:open-spotlight", onOpenSpotlight)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    window.db
      .getAllPrompts()
      .then((data) => {
        if (!cancelled) setPrompts(Array.isArray(data) ? data : [])
      })
      .catch((err) => console.error("Failed to load spotlight search data:", err))
    return () => {
      cancelled = true
    }
  }, [open])

  const handleSelectPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      toast.success(`Copied "${getPromptTitle(prompt.content)}" to clipboard!`)
      setOpen(false)
      if (window.electronAPI?.hideWindow) {
        await window.electronAPI.hideWindow()
      }
    } catch (error) {
      console.error("Failed to copy prompt:", error)
      toast.error("Failed to copy prompt")
    }
  }

  const sortedPrompts = useMemo(() => {
    return [...prompts].sort((a, b) => {
      if (b.favorite !== a.favorite) return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [prompts])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "top-[12%] translate-y-0 overflow-hidden rounded-xl p-0 gap-0 border border-border bg-popover shadow-lg",
          "w-[calc(100%-1.5rem)]",
          isMini ? "max-w-[calc(100%-1.5rem)]" : "max-w-2xl"
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Spotlight Search</DialogTitle>
        <DialogDescription className="sr-only">
          Quickly search prompts, copy to clipboard, and minimize the window.
        </DialogDescription>
        <Command className="rounded-xl border-0 bg-transparent p-0">
          <CommandInput
            placeholder="Search prompts by content, tags, or model..."
            className="text-sm focus-visible:ring-0"
          />
          <CommandList className="my-1 max-h-[460px] scrollbar-none">
            <CommandEmpty className="py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No matching prompts found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try refining your search terms.</p>
            </CommandEmpty>

            <CommandGroup heading="All Prompts" className="text-xs text-muted-foreground py-1">
              {sortedPrompts.map((prompt) => {
                const tagsList = parseTags(prompt.tags)
                const title = getPromptTitle(prompt.content)

                return (
                  <CommandItem
                    key={prompt.id}
                    value={`${title} ${prompt.content} ${prompt.tags} ${prompt.model}`}
                    onSelect={() => handleSelectPrompt(prompt)}
                    className="flex items-center gap-3 px-3 my-1.5 py-2.5 rounded-lg"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <IconFileText className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {prompt.favorite ? (
                          <IconStarFilled className="size-3 shrink-0 text-amber-400" />
                        ) : null}
                        <span className="text-sm font-semibold truncate text-foreground">
                          {title}
                        </span>
                        {prompt.model && !isMini && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] py-0 px-1.5 font-normal h-4 bg-muted text-muted-foreground border-border"
                          >
                            {prompt.model}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                        {prompt.content}
                      </p>
                      {!isMini && tagsList.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {tagsList.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[9px] py-0 px-1 font-normal h-4 border-border text-muted-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "hidden shrink-0 group-data-selected/command-item:flex items-center gap-1 self-center",
                        "text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded",
                        "bg-muted border border-border"
                      )}
                    >
                      <IconClipboard className="size-3" />
                      <span>Copy</span>
                      <IconCornerDownLeft className="size-2.5 ml-0.5 opacity-60" />
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground/60 select-none">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-semibold">
                <IconCommand className="size-2.5" />
                <span>Alt</span>
              </span>
              <span>+</span>
              <span className="flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-semibold">
                <span>P</span>
              </span>
              <span className="hidden sm:inline">to toggle</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="hidden sm:flex items-center gap-0.5">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1 text-[9px] font-semibold">Esc</kbd>
                <span>close</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-0.5">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1 text-[9px] font-semibold">Enter</kbd>
                <span>copy & minimize</span>
              </span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
