import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { toast } from "sonner"
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import {
  IconSearch, IconX, IconCopy, IconTrash, IconDotsVertical, IconEdit,
  IconStar, IconStarFilled, IconEye, IconEyeOff, IconShieldLock, IconLoader2,
  IconArrowLeft, IconPin, IconPinFilled, IconLink, IconPaperclip,
  IconFolderFilled, IconFolderPlus, IconFiles, IconPlus,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip"
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

const STICKY_TINTS = [
  "sticky-tint-yellow",
  "sticky-tint-green",
  "sticky-tint-blue",
  "sticky-tint-pink",
  "sticky-tint-purple",
  "sticky-tint-orange",
  "sticky-tint-teal",
  "sticky-tint-rose",
]

const TAG_COLORS = [
  "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400",
  "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
  "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
]

function getStickyTint(content) {
  let hash = 0
  const source = content || ""
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash)
  }
  return STICKY_TINTS[Math.abs(hash) % STICKY_TINTS.length]
}

function getTagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
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
  const [sortOrder] = useState("newest")
  const [attachmentCounts, setAttachmentCounts] = useState({})
  const [vaultFolders, setVaultFolders] = useState([])
  const [activeVaultFolder, setActiveVaultFolder] = useState(null)
  const [vaultFolderView, setVaultFolderView] = useState("folders")
  const [creatingVaultFolder, setCreatingVaultFolder] = useState(false)
  const [newVaultFolderName, setNewVaultFolderName] = useState("")
  const [moveItemId, setMoveItemId] = useState(null)
  const [addItemsOpen, setAddItemsOpen] = useState(false)
  const [addItemsSearch, setAddItemsSearch] = useState("")
  const createVaultFolderRef = useRef(null)
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
      const list = await window.vaultAPI.list({ sortOrder, search })
      setItems(Array.isArray(list) ? list : [])
      const counts = {}
      for (const item of (Array.isArray(list) ? list : [])) {
        try {
          const atts = await window.vaultAPI.listAttachments(item.id)
          counts[item.id] = Array.isArray(atts) ? atts.length : 0
        } catch { counts[item.id] = 0 }
      }
      setAttachmentCounts(counts)
    } catch (err) {
      console.error("Failed to load vault:", err)
      toast.error("Failed to load vault")
    } finally { setLoading(false) }
  }, [sortOrder, search])

  const loadAllVaultItems = useCallback(async () => {
    try {
      const list = await window.vaultAPI.list({ sortOrder: "newest", search: "" })
      setItems(Array.isArray(list) ? list : [])
    } catch { /* ignored */ }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadVaultFolders = useCallback(async () => {
    const all = await window.vaultFolderAPI.list()
    setVaultFolders(all || [])
  }, [])

  useEffect(() => { loadVaultFolders() }, [loadVaultFolders])

  const loadVaultFolderItems = useCallback(async (folderId) => {
    setLoading(true)
    try {
      const result = await window.vaultFolderAPI.getItems(folderId)
      setItems(result?.items || [])
    } catch { setItems([]) }
    setLoading(false)
  }, [])

  const openVaultFolder = useCallback(async (folder) => {
    setActiveVaultFolder(folder)
    setVaultFolderView("items")
    await loadVaultFolderItems(folder.id)
  }, [loadVaultFolderItems])

  const goBackToVaultFolders = () => {
    setVaultFolderView("folders")
    setActiveVaultFolder(null)
    load()
  }

  const createNewVaultFolder = async () => {
    if (!newVaultFolderName.trim()) return
    try {
      await window.vaultFolderAPI.create({ name: newVaultFolderName.trim(), parentId: activeVaultFolder?.id || null })
      setNewVaultFolderName("")
      setCreatingVaultFolder(false)
      await loadVaultFolders()
      toast.success("Folder created")
    } catch { toast.error("Failed") }
  }

  const renameVaultFolderHandler = async (id, name) => {
    try {
      await window.vaultFolderAPI.rename(id, name)
      await loadVaultFolders()
      toast.success("Renamed")
    } catch { toast.error("Failed") }
  }

  const deleteVaultFolderHandler = async (id) => {
    try {
      await window.vaultFolderAPI.delete(id)
      await loadVaultFolders()
      if (activeVaultFolder?.id === id) goBackToVaultFolders()
      toast.success("Deleted")
    } catch { toast.error("Failed") }
  }

  const moveVaultItemToFolder = async (folderId) => {
    if (!moveItemId || !folderId) return
    try {
      await window.vaultFolderAPI.addItem(moveItemId, folderId)
      setMoveItemId(null)
      if (activeVaultFolder) await loadVaultFolderItems(activeVaultFolder.id)
      toast.success("Moved")
    } catch { toast.error("Failed") }
  }

  const removeVaultItemFromFolder = async (itemId) => {
    if (!activeVaultFolder) return
    try {
      await window.vaultFolderAPI.removeItem(itemId, activeVaultFolder.id)
      await loadVaultFolderItems(activeVaultFolder.id)
      toast.success("Removed")
    } catch { toast.error("Failed") }
  }

  const addItemsToVaultFolder = async (itemIds) => {
    if (!activeVaultFolder || itemIds.length === 0) return
    try {
      for (const id of itemIds) await window.vaultFolderAPI.addItem(id, activeVaultFolder.id)
      await loadVaultFolderItems(activeVaultFolder.id)
      setAddItemsOpen(false)
      setAddItemsSearch("")
      toast.success(`${itemIds.length} item(s) added`)
    } catch { toast.error("Failed") }
  }

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

  function getCardTint(item) {
    if (item.color_bg) return null
    return getStickyTint(item.title + item.type)
  }

  function getCardInlineStyle(item) {
    if (!item.color_bg) return {}
    return {
      background: `linear-gradient(145deg, ${item.color_bg}dd 0%, ${item.color_bg}99 100%)`,
      color: item.color_text || "var(--foreground)",
    }
  }

  function renderCard(item, dragHandle) {
    const t = getVaultType(item.type)
    const Icon = t.icon
    const isRevealed = Boolean(revealed[item.id])
    const isCopied = Boolean(copied[item.id])
    const valueText = isRevealed ? (values[item.id] || "—") : maskValue(item.hasValue ? "secret" : "", item.type)
    const tint = getCardTint(item)
    const inlineStyle = getCardInlineStyle(item)
    const hasCustomColor = Boolean(item.color_bg)

    if (mini) {
      return (
        <div
          className={cn(
            "group flex cursor-default flex-col rounded-xl transition-all",
            hasCustomColor ? "sticky-note" : `sticky-note ${tint}`,
            isCopied && "ring-1 ring-primary/40"
          )}
          style={inlineStyle}
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
                  <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground leading-snug flex items-center gap-1">
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

            {item.url && (
              <div className="flex items-center gap-1 text-[11px] text-foreground/60">
                <IconLink size={10} className="shrink-0" />
                <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {(typeof item.tags === "string" ? item.tags.split(",").map((t) => t.trim()).filter(Boolean) : item.tags).slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-full border px-1.5 py-[1px] text-[10px] font-medium leading-tight",
                      getTagColor(tag)
                    )}
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 4 && (
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-black/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70">
                    +{item.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            {attachmentCounts[item.id] > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-foreground/50">
                <IconPaperclip size={10} />
                <span>{attachmentCounts[item.id]} file(s)</span>
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
                  <DropdownMenuItem onClick={() => setMoveItemId(item.id)}>
                    <IconFolderPlus className="size-3.5" /> Move to folder
                  </DropdownMenuItem>
                  {activeVaultFolder && (
                    <DropdownMenuItem onClick={() => removeVaultItemFromFolder(item.id)}>
                      <IconArrowLeft className="size-3.5" /> Remove from folder
                    </DropdownMenuItem>
                  )}
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
          "group relative flex cursor-default flex-col overflow-hidden rounded-xl transition-all",
          hasCustomColor ? "sticky-note" : `border border-border bg-card hover:ring-1 hover:ring-primary/30`,
          isCopied && "ring-1 ring-primary/40"
        )}
        style={inlineStyle}
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

          <div className="flex min-h-[32px] items-center gap-2 rounded-lg bg-white/40 px-2 py-1.5 backdrop-blur-sm">
            <Icon size={13} className="shrink-0 text-foreground/50" />
            <span className={cn(
              "min-w-0 flex-1 truncate font-mono text-xs",
              isRevealed ? "text-foreground" : "text-foreground/70"
            )}>
              {valueText}
            </span>
            <button
              onClick={() => handleToggleReveal(item)}
              className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground"
              aria-label={isRevealed ? "Hide value" : "Reveal value"}
            >
              {isRevealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
          </div>

          {(item.notes || item.tags.length > 0 || item.url) && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {item.url && (
                <a
                  href={item.url}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.shellAPI?.openExternal(item.url)
                  }}
                  className="flex items-center gap-1 min-w-0 max-w-[60%] flex-1 text-[11px] text-primary/70 hover:text-primary transition-colors"
                  title={item.url}
                >
                  <IconLink size={10} className="shrink-0" />
                  <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {item.notes && (
                <p className="line-clamp-1 min-w-0 max-w-[60%] flex-1 text-[11px] text-foreground/60">
                  {item.notes}
                </p>
              )}
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-[1px] text-[10px] font-medium leading-tight",
                    getTagColor(tag)
                  )}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="inline-flex items-center rounded-full border border-border/60 bg-black/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70">
                  +{item.tags.length - 2}
                </span>
              )}
              {attachmentCounts[item.id] > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-foreground/50">
                  <IconPaperclip size={10} />
                  {attachmentCounts[item.id]}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <button
              onClick={() => copySecret(item.id)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
            >
              <IconCopy className="size-3.5" />
              {isCopied ? "Copied!" : "Copy"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/80" aria-label="More options">
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
          <div className="min-w-0 flex items-center gap-2">
            {!sidebarVisible && vaultFolderView === "items" && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={goBackToVaultFolders}>
                <IconArrowLeft size={14} />
              </Button>
            )}
            {!sidebarVisible && vaultFolderView === "folders" && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate("/")}>
                <IconArrowLeft size={14} />
              </Button>
            )}
            {sidebarVisible ? (
              <>
                <h1 className="truncate text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <IconShieldLock size={18} className="text-primary" />
                  {vaultFolderView === "items" && activeVaultFolder ? activeVaultFolder.name : "Vault"}
                </h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Store API keys, passwords &amp; secrets securely
                </p>
              </>
            ) : (
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                <IconShieldLock size={16} className="text-primary" />
                {vaultFolderView === "items" && activeVaultFolder ? activeVaultFolder.name : "Vault"}
              </h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {vaultFolderView === "items" && activeVaultFolder && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { loadAllVaultItems(); setAddItemsOpen(true) }}>
                <IconPlus size={14} />
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={vaultFolderView === "folders" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    if (vaultFolderView === "folders") { setVaultFolderView("items"); setActiveVaultFolder(null); load() }
                    else goBackToVaultFolders()
                  }}
                >
                  <IconFiles size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{vaultFolderView === "folders" ? "All items" : "Folders"}</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
              setCreatingVaultFolder(true)
              setNewVaultFolderName("New Folder")
              setTimeout(() => createVaultFolderRef.current?.select(), 50)
            }}>
              <IconFolderPlus size={14} />
            </Button>
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

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {creatingVaultFolder && vaultFolderView === "folders" && (
          <div className="flex items-center gap-2 mb-3 animate-in fade-in" style={{ animationDuration: "0.15s" }}>
            <IconFolderFilled size={20} className="text-yellow-500/80 shrink-0" />
            <input
              ref={createVaultFolderRef}
              value={newVaultFolderName}
              onChange={(e) => setNewVaultFolderName(e.target.value)}
              onBlur={() => { if (newVaultFolderName.trim()) createNewVaultFolder(); else setCreatingVaultFolder(false) }}
              onKeyDown={(e) => {
                if (e.key === "Enter") createNewVaultFolder()
                if (e.key === "Escape") { setCreatingVaultFolder(false); setNewVaultFolderName("") }
              }}
              className="flex-1 min-w-0 bg-transparent border-b border-ring/50 px-1 py-0.5 text-xs outline-none"
              autoFocus
            />
          </div>
        )}

        {vaultFolderView === "folders" ? (
          /* VAULT FOLDER GRID */
          vaultFolders.length === 0 && !creatingVaultFolder ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <IconFolderFilled size={48} className="text-muted-foreground/20" strokeWidth={1} />
              <p className="text-xs text-muted-foreground/60">No folders yet</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => {
                setCreatingVaultFolder(true); setNewVaultFolderName("New Folder")
                setTimeout(() => createVaultFolderRef.current?.select(), 50)
              }}>
                <IconFolderPlus size={12} /> Create Folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
              {vaultFolders.filter((f) => f.name.toLowerCase().includes(searchInput.toLowerCase())).map((folder, idx) => (
                <VaultFolderTile
                  key={folder.id}
                  folder={folder}
                  index={idx}
                  onOpen={openVaultFolder}
                  onRename={renameVaultFolderHandler}
                  onDelete={deleteVaultFolderHandler}
                />
              ))}
            </div>
          )
        ) : (
          /* VAULT ITEMS */
          <>
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
          </>
        )}
      </div>

      <VaultItemDialog onSaved={() => load()} />
      <VaultItemDialog hideTrigger open={Boolean(editItem)} onOpenChange={(o) => { if (!o) setEditItem(null) }} onSaved={() => load()} item={editItem} />
      {addItemsOpen && (
        <VaultAddItemsDialog
          open={addItemsOpen}
          onOpenChange={setAddItemsOpen}
          items={items}
          search={addItemsSearch}
          onSearchChange={setAddItemsSearch}
          onAdd={addItemsToVaultFolder}
          folderName={activeVaultFolder?.name}
        />
      )}
      {moveItemId && (
        <VaultMoveToFolderDialog
          open={Boolean(moveItemId)}
          onOpenChange={() => setMoveItemId(null)}
          folders={vaultFolders}
          onSelect={(folderId) => moveVaultItemToFolder(folderId)}
        />
      )}
    </div>
  )
}

function VaultFolderTile({ folder, index, onOpen, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [editing])

  function handleSave() {
    if (name.trim() && name.trim() !== folder.name) onRename(folder.id, name.trim())
    else setName(folder.name)
    setEditing(false)
  }

  return (
    <div
      className="group flex flex-col items-center gap-1 rounded-lg border border-border/30 bg-muted/20 hover:bg-accent/30 p-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 animate-in fade-in"
      style={{ animationDelay: `${index * 20}ms`, animationFillMode: "backwards" }}
      onClick={() => onOpen(folder)}
    >
      <IconFolderFilled size={28} className="text-yellow-500/80 shrink-0" strokeWidth={1.5} />
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") { setName(folder.name); setEditing(false) }
            e.stopPropagation()
          }}
          className="w-full bg-transparent border-b border-ring/50 px-1 py-0.5 text-[10px] text-center outline-none"
        />
      ) : (
        <span className="text-[10px] text-foreground/80 truncate max-w-full">{folder.name}</span>
      )}
      <DropdownMenu onOpenChange={(o) => { if (o) setName(folder.name) }}>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconDotsVertical size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true) }}>
            <IconEdit size={13} className="mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (confirm("Delete this folder?")) onDelete(folder.id) }} className="text-destructive">
            <IconTrash size={13} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function VaultAddItemsDialog({ open, onOpenChange, items, search, onSearchChange, onAdd, folderName }) {
  const [selected, setSelected] = useState(new Set())
  const inputRef = useRef(null)
  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.username?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-96">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Add items to "{folderName}"</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search items..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-muted/40 border border-border/50 rounded-md outline-none focus:border-ring"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-4 pb-2">
          {filtered.map((item) => (
            <label key={item.id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-accent/30 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="accent-primary"
              />
              <span className="text-xs truncate">{item.title}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No items found</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 pb-3">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={selected.size === 0}
            onClick={() => onAdd(Array.from(selected))}
          >
            Add {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VaultMoveToFolderDialog({ open, onOpenChange, folders, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-80">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Move to folder</DialogTitle>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {folders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No folders</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => { onSelect(folder.id); onOpenChange(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-accent/30 text-xs text-left transition-colors"
              >
                <IconFolderFilled size={14} className="text-yellow-500/80 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
