import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { toast } from "sonner"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import {
  IconSearch, IconX, IconCopy, IconTrash, IconDotsVertical, IconEdit,
  IconStar, IconStarFilled, IconEye, IconEyeOff, IconShieldLock, IconLoader2,
  IconMinimize, IconMaximize, IconArrowLeft, IconPin, IconPinFilled,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { VaultItemDialog, getVaultType } from "@/components/vault-item-dialog"
import { SortableVaultCard } from "@/components/sortable-vault-card"
import { cn } from "@/lib/utils"

function maskValue(value, type) {
  const raw = value || ""
  if (!raw) return "Empty"
  if (type === "password" || type === "card") return "••••••••••••"
  if (raw.length <= 8) return "•".repeat(raw.length)
  return `${raw.slice(0, 4)}${"•".repeat(8)}${raw.slice(-4)}`
}

export default function VaultPage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [revealed, setRevealed] = useState({})
  const [values, setValues] = useState({})
  const [copied, setCopied] = useState({})
  const [editItem, setEditItem] = useState(null)
  const [encryptionAvailable, setEncryptionAvailable] = useState(true)
  const [sortOrder, setSortOrder] = useState("newest")
  const searchRef = useRef(null)
  const mini = !sidebarVisible
  const isCustomSort = sortOrder === "custom"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const health = await window.vaultAPI.health()
      setEncryptionAvailable(Boolean(health?.encryptionAvailable))
      const list = await window.vaultAPI.list({
        sortOrder,
        search,
      })
      setItems(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error("Failed to load vault:", err)
      toast.error("Failed to load vault")
    } finally {
      setLoading(false)
    }
  }, [sortOrder, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    window.settingsAPI?.get("vaultSortOrder", "newest").then((v) => setSortOrder(v))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase()
        const isEditable = tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable
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

  async function copySecret(id) {
    try {
      const res = await window.vaultAPI.copy(id)
      if (res?.success) {
        navigator.clipboard.writeText(res.value)
        setCopied((c) => ({ ...c, [id]: true }))
        setTimeout(() => setCopied((c) => ({ ...c, [id]: false })), 1500)
        toast.success("Copied to clipboard")
      } else {
        toast.error("Failed to copy")
      }
    } catch (err) {
      toast.error("Failed to copy")
      console.error(err)
    }
  }

  async function handleToggleFavorite(id) {
    try {
      await window.vaultAPI.toggleFavorite(id)
      await load()
    } catch (err) {
      toast.error("Failed to update favorite")
      console.error(err)
    }
  }

  async function handleTogglePin(id) {
    try {
      await window.vaultAPI.togglePin(id)
      await load()
    } catch (err) {
      toast.error("Failed to update pin")
      console.error(err)
    }
  }

  async function handleDelete(id) {
    try {
      await window.vaultAPI.delete(id)
      await load()
      toast.success("Credential deleted")
    } catch (err) {
      toast.error("Failed to delete")
      console.error(err)
    }
  }

  async function handleToggleReveal(item) {
    if (revealed[item.id]) {
      setRevealed((r) => ({ ...r, [item.id]: false }))
      return
    }
    try {
      if (values[item.id] === undefined) {
        const full = await window.vaultAPI.get(item.id)
        setValues((v) => ({ ...v, [item.id]: full?.value ?? "" }))
      }
      setRevealed((r) => ({ ...r, [item.id]: true }))
      setTimeout(() => {
        setRevealed((r) => ({ ...r, [item.id]: false }))
      }, 15000)
    } catch (err) {
      toast.error("Failed to reveal value")
      console.error(err)
    }
  }

  async function handleMiniToggle() {
    try {
      if (mini) {
        await window.windowAPI.setDefaultSize("medium")
      } else {
        await window.windowAPI.setDefaultSize("mini")
      }
      if (window.windowAPI.showPopover) await window.windowAPI.showPopover()
    } catch (err) {
      console.error(err)
    }
  }

  function handleSortChange(value) {
    setSortOrder(value)
    window.settingsAPI?.set("vaultSortOrder", value)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((p) => p.id === active.id)
    const newIndex = items.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }))
    window.vaultAPI.updateOrder(updates).catch((err) => {
      console.error("Failed to save vault order:", err)
      toast.error("Failed to save order")
    })
  }

  const hasSearch = Boolean(search.trim())

  const VAULT_TINTS = {
    api_key: "sticky-tint-blue",
    password: "sticky-tint-purple",
    token: "sticky-tint-green",
    card: "sticky-tint-yellow",
    note: "sticky-tint-rose",
  }

  function getVaultTint(item) {
    return VAULT_TINTS[item.type] || "sticky-tint-yellow"
  }

  function renderCard(item, dragHandle) {
    const t = getVaultType(item.type)
    const Icon = t.icon
    const isRevealed = Boolean(revealed[item.id])
    const isCopied = Boolean(copied[item.id])
    const valueText = isRevealed ? (values[item.id] || "—") : maskValue(item.hasValue ? "secret" : "", item.type)

    if (mini) {
      return (
        <div
          className={cn(
            "group flex cursor-default flex-col rounded-xl transition-all sticky-note",
            getVaultTint(item),
            isCopied && "ring-1 ring-primary/40"
          )}
        >
          <div className="flex flex-1 flex-col gap-2 p-3.5 pb-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {dragHandle && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {dragHandle}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-[13px] font-semibold leading-snug text-foreground flex items-center gap-1">
                    {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
                    <span className="truncate">{item.title}</span>
                  </h3>
                </div>
              </div>
              <button
                onClick={() => handleToggleFavorite(item.id)}
                className="shrink-0 cursor-pointer transition-all hover:scale-110"
                aria-label={item.favorite ? "Unfavorite" : "Favorite"}
              >
                {item.favorite ? (
                  <IconStarFilled size={14} className="text-amber-500 drop-shadow-sm" />
                ) : (
                  <IconStar size={14} className="text-foreground/30 hover:text-amber-500" />
                )}
              </button>
            </div>

            <div className="flex min-h-[30px] items-center gap-2 rounded-lg bg-white/40 px-2 py-1.5 backdrop-blur-sm">
              <Icon size={13} className="shrink-0 text-foreground/50" />
              <span className={cn(
                "min-w-0 flex-1 truncate font-mono text-xs",
                isRevealed ? "text-foreground" : "text-foreground/70"
              )}>
                {valueText}
              </span>
              <button
                onClick={() => handleToggleReveal(item)}
                className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label={isRevealed ? "Hide value" : "Reveal value"}
              >
                {isRevealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
            </div>

            {item.notes && (
              <p className="line-clamp-1 text-[11px] text-foreground/60">{item.notes}</p>
            )}

            {item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {item.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-black/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 4 && (
                  <span className="inline-flex items-center rounded-full bg-black/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70">
                    +{item.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between px-3.5 py-1.5">
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-foreground/40">
              {t.label}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => copySecret(item.id)}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
              >
                <IconCopy className="size-3" />
                {isCopied ? "Copied!" : "Copy"}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex cursor-pointer items-center justify-center rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    aria-label="More options"
                  >
                    <IconDotsVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => setEditItem(item)}>
                    <IconEdit className="size-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTogglePin(item.id)}>
                    {item.pinned ? <IconPinFilled className="size-3.5" /> : <IconPin className="size-3.5" />}
                    {item.pinned ? "Unpin" : "Pin to top"}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => handleDelete(item.id)}>
                    <IconTrash className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          "group relative flex cursor-default flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-sm hover:ring-1 hover:ring-primary/30",
          isCopied && "ring-1 ring-primary/40"
        )}
      >
        <div className="flex flex-1 flex-col gap-2.5 p-3">
          {dragHandle && (
            <div
              className="absolute -left-1 top-1/2 -translate-y-1/2"
              onClick={(e) => e.stopPropagation()}
            >
              {dragHandle}
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", t.color)}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <h3 className="flex items-center gap-1 text-[13px] font-semibold text-foreground leading-snug">
                  {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
                  <span className="truncate">{item.title}</span>
                </h3>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {t.label}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggleFavorite(item.id)}
              className="shrink-0 cursor-pointer opacity-70 transition-opacity hover:opacity-100 hover:text-amber-400"
              aria-label={item.favorite ? "Unfavorite" : "Favorite"}
            >
              {item.favorite ? (
                <IconStarFilled size={15} className="text-amber-400 opacity-100" />
              ) : (
                <IconStar size={15} className="text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="flex min-h-[32px] items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
            <span className={cn(
              "min-w-0 flex-1 truncate font-mono text-xs",
              isRevealed ? "text-foreground" : "text-foreground/80"
            )}>
              {valueText}
            </span>
            <button
              onClick={() => handleToggleReveal(item)}
              className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              aria-label={isRevealed ? "Hide value" : "Reveal value"}
            >
              {isRevealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
          </div>

          {(item.notes || item.tags.length > 0) && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {item.notes && (
                <p className="line-clamp-1 min-w-0 max-w-[60%] flex-1 text-[11px] text-muted-foreground">
                  {item.notes}
                </p>
              )}
              {item.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="inline-flex items-center rounded bg-muted/60 px-1.5 py-[1px] text-[10px] font-medium text-muted-foreground leading-tight">
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-[1px] text-[10px] font-medium text-muted-foreground leading-tight">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <button
              onClick={() => copySecret(item.id)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <IconCopy className="size-3.5" />
              {isCopied ? "Copied!" : "Copy"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="More options">
                  <IconDotsVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setEditItem(item)}>
                  <IconEdit className="size-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTogglePin(item.id)}>
                  {item.pinned ? <IconPinFilled className="size-3.5" /> : <IconPin className="size-3.5" />}
                  {item.pinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(item.id)}>
                  <IconTrash className="size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-border/30 px-6 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {sidebarVisible ? (
              <>
                <h1 className="truncate text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <IconShieldLock size={18} className="text-primary" />
                  Vault
                </h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Store API keys, passwords &amp; secrets securely
                </p>
              </>
            ) : (
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                <IconShieldLock size={16} className="text-primary" />
                Vault{" "}
                <span className="font-normal text-muted-foreground tabular-nums">
                  ({items.length.toLocaleString()})
                </span>
              </h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="h-9 w-[120px] cursor-pointer text-xs" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="custom">Drag &amp; drop</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 cursor-pointer"
                  onClick={handleMiniToggle}
                  aria-label={mini ? "Expand window" : "Switch to mini window"}
                >
                  {mini ? <IconMaximize size={16} /> : <IconMinimize size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {mini ? "Expand window" : "Switch to mini window"}
              </TooltipContent>
            </Tooltip>
            {!sidebarVisible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer"
                onClick={() => navigate("/")}
                aria-label="Back"
              >
                <IconArrowLeft size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="group/search relative flex h-9 w-full items-center rounded-lg border border-border bg-background/60 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
          <IconSearch size={14} stroke={2.2} className="ml-3 shrink-0 text-muted-foreground" />
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
            placeholder="Search vault…"
            className="h-8 w-full min-w-0 border-0 bg-transparent pl-2 pr-1 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent"
          />
          {searchInput ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => { setSearchInput(""); setSearch(""); searchRef.current?.focus() }}
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
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!encryptionAvailable && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Secure encryption unavailable</p>
            <p className="mt-0.5 text-amber-600/80 dark:text-amber-300/70">
              Values are stored base64-encoded but not OS-encrypted. On Windows/macOS the OS keychain is used automatically.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="sticky-note sticky-tint-yellow p-6 text-center">
              <p className="text-lg font-semibold text-foreground/80">
                {hasSearch ? "No matching credentials" : "Vault is empty"}
              </p>
              <p className="text-sm mt-2 text-foreground/60">
                {hasSearch
                  ? "Try a different search"
                  : "Click + to save your first API key or password"}
              </p>
            </div>
          </div>
        ) : isCustomSort ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((item) => (
                  <SortableVaultCard
                    key={item.id}
                    id={item.id}
                    disabled={item.pinned}
                  >
                    {({ dragHandle }) => renderCard(item, item.pinned ? undefined : dragHandle)}
                  </SortableVaultCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative">{renderCard(item, undefined)}</div>
            ))}
          </div>
        )}
      </div>

      <VaultItemDialog onSaved={() => load()} mini={mini} />
      <VaultItemDialog hideTrigger open={Boolean(editItem)} onOpenChange={(o) => { if (!o) setEditItem(null) }} onSaved={() => load()} item={editItem} mini={mini} />
    </div>
  )
}