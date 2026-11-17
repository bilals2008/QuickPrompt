import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  IconArrowsTransferUpDown,
  IconChecks,
  IconClipboard,
  IconCornerDownLeft,
  IconFileText,
  IconFolder,
  IconHome2,
  IconLayoutGrid,
  IconPalette,
  IconPlus,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { THEMES, useTheme } from "@/components/theme-provider.jsx"
import { getPromptTitle } from "@/lib/prompt-utils"
import { cn } from "@/lib/utils"

const MAX_PROMPT_RESULTS = 8

function Key({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/70 bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [prompts, setPrompts] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("qp:open-command-palette", onOpen)
    return () => window.removeEventListener("qp:open-command-palette", onOpen)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }
    let cancelled = false
    window.db
      ?.getAllPrompts?.()
      .then((data) => {
        if (!cancelled) setPrompts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setPrompts([])
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // HomePage owns these views, so the palette asks for them by event and only after
  // the route has actually mounted.
  const askHome = useCallback(
    (eventName, detail) => {
      if (location.pathname === "/") {
        window.dispatchEvent(new CustomEvent(eventName, { detail }))
      } else {
        navigate("/")
        window.setTimeout(
          () => window.dispatchEvent(new CustomEvent(eventName, { detail })),
          80,
        )
      }
    },
    [location.pathname, navigate],
  )

  const groups = useMemo(() => {
    const toggleView = async () => {
      const current = (await window.settingsAPI?.get("defaultView", "grid")) || "grid"
      const next = current === "grid" ? "list" : "grid"
      await window.settingsAPI?.set("defaultView", next)
      askHome("qp:set-view", next)
    }

    const cycleTheme = () => {
      const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
      setTheme(next)
      toast.success(`Theme: ${next}`)
    }

    return [
      {
        heading: "Create",
        items: [
          {
            id: "new-prompt",
            label: "New prompt",
            icon: IconPlus,
            run: () => askHome("qp:new-prompt"),
          },
          {
            id: "select",
            label: "Select prompts",
            description: "Multi-select for batch actions",
            icon: IconChecks,
            run: () => askHome("qp:select-mode"),
          },
        ],
      },
      {
        heading: "Find",
        items: [
          {
            id: "search-prompts",
            label: "Search all prompts",
            icon: IconSearch,
            keys: ["Ctrl", "K"],
            run: () => window.dispatchEvent(new Event("qp:open-spotlight")),
          },
          {
            id: "favourites",
            label: "Show favourites only",
            icon: IconStar,
            run: () => askHome("qp:show-favorites"),
          },
        ],
      },
      {
        heading: "View",
        items: [
          {
            id: "toggle-view",
            label: "Toggle view mode",
            description: "Grid / list",
            icon: IconLayoutGrid,
            run: toggleView,
          },
          {
            id: "theme",
            label: "Switch theme",
            description: theme,
            icon: IconPalette,
            run: cycleTheme,
          },
        ],
      },
      {
        heading: "Go to",
        items: [
          { id: "nav-prompts", label: "Prompts", icon: IconHome2, run: () => navigate("/") },
          { id: "nav-vault", label: "Vault", icon: IconShieldLock, run: () => navigate("/vault") },
          {
            id: "nav-collections",
            label: "Collections",
            icon: IconFolder,
            run: () => navigate("/collections"),
          },
          {
            id: "nav-import",
            label: "Import / export",
            icon: IconArrowsTransferUpDown,
            run: () => navigate("/import-export"),
          },
          { id: "nav-settings", label: "Settings", icon: IconSettings, run: () => navigate("/settings") },
        ],
      },
    ]
  }, [askHome, navigate, setTheme, theme])

  const matchingPrompts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return prompts
      .filter((prompt) =>
        `${getPromptTitle(prompt)} ${prompt.content} ${prompt.tags ?? ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, MAX_PROMPT_RESULTS)
  }, [prompts, query])

  const copyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      toast.success(`Copied "${getPromptTitle(prompt)}"`)
    } catch {
      toast.error("Failed to copy prompt")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "top-[12%] translate-y-0 gap-0 overflow-hidden rounded-xl border border-border/70 p-0",
          "bg-popover/85 ring-1 ring-foreground/10 backdrop-blur-2xl",
          "shadow-[0_32px_80px_-24px_rgb(0_0_0/0.65),0_2px_10px_-4px_rgb(0_0_0/0.5)]",
          "w-[calc(100%-1.5rem)] max-w-[620px]"
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Run a command, or search your prompts and copy one.
        </DialogDescription>

        <Command className="rounded-xl border-0 bg-transparent p-0">
          <CommandInput
            placeholder="Type a command, or search prompts…"
            className="h-12 text-[15px] focus-visible:ring-0"
            onValueChange={setQuery}
          />

          <CommandList className="my-0 max-h-[380px] scrollbar-none">
            <CommandEmpty className="py-12 text-center">
              <IconSearch className="mx-auto mb-2 size-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No commands or prompts match</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">Try different keywords</p>
            </CommandEmpty>

            {groups.map((group) => (
              <CommandGroup
                key={group.heading}
                heading={group.heading}
                className="[&_[cmdk-group-items]]:space-y-1 px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
              >
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.id} ${item.description ?? ""}`}
                    onSelect={() => {
                      setOpen(false)
                      item.run()
                    }}
                    className="h-9 gap-2.5 rounded-md px-2 text-[13px] hover:bg-muted/50 data-[selected=true]:bg-accent data-[selected=true]:text-foreground"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground transition-colors group-data-[selected=true]/command-item:bg-primary/15 group-data-[selected=true]/command-item:text-primary">
                      <item.icon className="size-3.5" />
                    </span>
                    <span className="truncate font-medium text-foreground">{item.label}</span>
                    {item.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                    {item.keys && (
                      <span className="ml-auto flex items-center gap-1">
                        {item.keys.map((k) => (
                          <Key key={k}>{k}</Key>
                        ))}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {matchingPrompts.length > 0 && (
              <>
                <CommandSeparator className="mx-2 my-1" />
                <CommandGroup
                  heading="Copy a prompt"
                  className="[&_[cmdk-group-items]]:space-y-1 px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
                >
                  {matchingPrompts.map((prompt) => {
                    const title = getPromptTitle(prompt)
                    return (
                      <CommandItem
                        key={prompt.id}
                        value={`${title} ${prompt.content} ${prompt.tags ?? ""}`}
                        onSelect={() => {
                          setOpen(false)
                          copyPrompt(prompt)
                        }}
                        className="h-auto gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 data-[selected=true]:bg-accent data-[selected=true]:text-foreground"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground transition-colors group-data-[selected=true]/command-item:bg-primary/15 group-data-[selected=true]/command-item:text-primary">
                          <IconFileText className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {prompt.favorite ? (
                              <IconStarFilled className="size-3 shrink-0 text-amber-400" />
                            ) : null}
                            <span className="truncate text-[13px] font-medium text-foreground">
                              {title}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {prompt.content}
                          </p>
                        </div>
                        <span className="ml-auto hidden shrink-0 items-center gap-1 text-[10px] text-muted-foreground group-data-[selected=true]/command-item:flex">
                          <IconClipboard className="size-3" />
                          <Key>
                            <IconCornerDownLeft className="size-2.5" />
                          </Key>
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>

          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-3 py-2 select-none">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Key>↑</Key>
              <Key>↓</Key>
              <span className="ml-1">navigate</span>
              <Key>↵</Key>
              <span>run</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Key>esc</Key>
              <span>close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export default CommandPalette
