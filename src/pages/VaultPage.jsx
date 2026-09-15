import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconCheckbox,
  IconFiles,
  IconFolderPlus,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconShieldLock,
  IconX,
} from "@tabler/icons-react"
import {
  VaultViewToggle,
  VAULT_VIEW_MODES,
  VAULT_SORT_ORDERS,
} from "@/components/vault/VaultViewToggle"
import {
  VaultGridView,
  VaultListView,
  VaultSpotlightView,
} from "@/components/vault/VaultItemViews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { VaultItemDialog } from "@/components/vault-item-dialog"
import { VaultAddItemsDialog } from "@/components/vault/VaultAddItemsDialog"
import { VaultMoveToFolderDialog } from "@/components/vault/VaultMoveToFolderDialog"
import { VaultFolderDetailsDialog } from "@/components/vault/VaultFolderDetailsDialog"
import { FolderTile } from "@/components/folders/FolderTile"
import { NewFolderDialog } from "@/components/folders/NewFolderDialog"
import { BulkDeleteConfirmDialog } from "@/components/folders/BulkDeleteConfirmDialog"
import { FolderBreadcrumb } from "@/components/folders/FolderBreadcrumb"
import { FolderCustomizeDialog } from "@/components/folders/FolderCustomizeDialog"
import { SectionHeader } from "@/components/section-header"
import { EmptyState } from "@/components/empty-state"
import { useVaultFolders } from "@/hooks/useVaultFolders"
import { useFolderDisplaySettings } from "@/hooks/useFolderDisplaySettings"
import { cn } from "@/lib/utils"

function EncryptionNotice() {
  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
      <p className="font-semibold">Secure encryption unavailable</p>
      <p className="mt-0.5 text-amber-600/80 dark:text-amber-300/70">
        Values are stored base64-encoded but not OS-encrypted.
      </p>
    </div>
  )
}

export default function VaultPage() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const [folderDisplay] = useFolderDisplaySettings()
  const {
    folders: vaultFolders,
    childrenOf,
    createFolder,
    updateFolder,
    deleteFolder,
    breadcrumbFor,
  } = useVaultFolders()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [revealed, setRevealed] = useState({})
  const [values, setValues] = useState({})
  const [copied, setCopied] = useState({})
  const [editItem, setEditItem] = useState(null)
  const [encryptionAvailable, setEncryptionAvailable] = useState(true)
  const [attachmentCounts, setAttachmentCounts] = useState({})

  const [activeVaultFolder, setActiveVaultFolder] = useState(null)
  const [showFolders, setShowFolders] = useState(true)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderParentId, setNewFolderParentId] = useState(null)
  const [moveItemId, setMoveItemId] = useState(null)
  const [addItemsOpen, setAddItemsOpen] = useState(false)
  const [addItemsSearch, setAddItemsSearch] = useState("")
  const [allVaultItems, setAllVaultItems] = useState([])
  const [detailsFolder, setDetailsFolder] = useState(null)
  const [detailsItems, setDetailsItems] = useState([])
  const [detailsChildren, setDetailsChildren] = useState([])
  const [customizeFolder, setCustomizeFolder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [folderStats, setFolderStats] = useState({})
  const [selectedFolderIds, setSelectedFolderIds] = useState(new Set())
  const [selectionActive, setSelectionActive] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [itemViewMode, setItemViewMode] = useState("grid")
  const [sortOrder, setSortOrder] = useState("newest")

  const searchRef = useRef(null)
  const mini = !sidebarVisible

  const roots = useMemo(() => vaultFolders.filter((f) => !f.parent_id), [vaultFolders])
  const childFolders = activeVaultFolder ? childrenOf(activeVaultFolder.id) : []
  const breadcrumb = useMemo(
    () => (activeVaultFolder ? breadcrumbFor(activeVaultFolder.id) : []),
    [activeVaultFolder, breadcrumbFor]
  )

  /* ---------------- data loading ---------------- */

  const loadAttachmentCounts = useCallback(async (list) => {
    const counts = {}
    await Promise.all(
      (list || []).map(async (item) => {
        try {
          const atts = await window.vaultAPI.listAttachments(item.id)
          counts[item.id] = Array.isArray(atts) ? atts.length : 0
        } catch {
          counts[item.id] = 0
        }
      })
    )
    setAttachmentCounts(counts)
  }, [])

  const loadGlobalItems = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.vaultAPI.list({ sortOrder, search })
      const arr = Array.isArray(list) ? list : []
      setItems(arr)
      await loadAttachmentCounts(arr)
    } catch (err) {
      console.error("Failed to load vault:", err)
      toast.error("Failed to load vault")
    } finally {
      setLoading(false)
    }
  }, [search, sortOrder, loadAttachmentCounts])

  const loadFolderItems = useCallback(
    async (folder) => {
      if (!folder) return
      setLoading(true)
      try {
        const itemsResult = await window.vaultFolderAPI.getItems(folder.id, { sortOrder })
        const arr = itemsResult?.items || []
        setItems(arr)
        await loadAttachmentCounts(arr)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [sortOrder, loadAttachmentCounts]
  )

  /** Reloads whatever list is currently visible (folder items or all items). */
  const reloadCurrent = useCallback(() => {
    if (activeVaultFolder) return loadFolderItems(activeVaultFolder)
    return loadGlobalItems()
  }, [activeVaultFolder, loadFolderItems, loadGlobalItems])

  useEffect(() => {
    if (activeVaultFolder) return
    loadGlobalItems()
  }, [activeVaultFolder, loadGlobalItems])

  useEffect(() => {
    window.vaultAPI
      ?.health?.()
      .then((h) => setEncryptionAvailable(Boolean(h?.encryptionAvailable)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    window.settingsAPI?.get("vaultViewMode", "grid").then((v) => {
      if (VAULT_VIEW_MODES.includes(v)) setItemViewMode(v)
    })
    window.settingsAPI?.get("vaultSortOrder", "newest").then((v) => {
      if (VAULT_SORT_ORDERS.includes(v)) setSortOrder(v)
    })
  }, [])

  const changeViewMode = useCallback((mode) => {
    setItemViewMode(mode)
    window.settingsAPI?.set("vaultViewMode", mode)
  }, [])

  const changeSortOrder = useCallback((order) => {
    setSortOrder(order)
    window.settingsAPI?.set("vaultSortOrder", order)
  }, [])

  // Per-folder item counts for the tile badges.
  useEffect(() => {
    if (!folderDisplay.showItemCounts || vaultFolders.length === 0) {
      setFolderStats({})
      return
    }
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        vaultFolders.map(async (f) => {
          try {
            const r = await window.vaultFolderAPI.getItems(f.id)
            return [f.id, r?.total ?? 0]
          } catch {
            return [f.id, 0]
          }
        })
      )
      if (!cancelled) setFolderStats(Object.fromEntries(entries))
    })()
    return () => {
      cancelled = true
    }
  }, [vaultFolders, folderDisplay.showItemCounts])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase()
        const isEditable =
          tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable
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

  /* ---------------- folder actions ---------------- */

  const openVaultFolder = useCallback(
    async (folder) => {
      if (!folder) return
      setActiveVaultFolder(folder)
      setNewFolderOpen(false)
      setSelectedFolderIds(new Set())
      await loadFolderItems(folder)
    },
    [loadFolderItems]
  )

  const goBackToVaultFolders = useCallback(() => {
    setActiveVaultFolder(null)
    setNewFolderOpen(false)
    setSelectedFolderIds(new Set())
  }, [])

  const startCreating = (parentId) => {
    setNewFolderParentId(parentId)
    setNewFolderOpen(true)
  }

  const handleCreateFolder = async ({ name, icon, color }) => {
    try {
      await createFolder({
        name,
        parentId: newFolderParentId ?? null,
        icon,
        color,
      })
      toast.success(newFolderParentId ? "Subfolder created" : "Folder created")
    } catch {
      toast.error("Failed to create folder")
    }
  }

  const handleSaveFolder = async (id, patch) => {
    try {
      const updated = await updateFolder(id, patch)
      if (updated && activeVaultFolder?.id === id) setActiveVaultFolder(updated)
      toast.success("Folder updated")
    } catch {
      toast.error("Failed to update folder")
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!folder) return
    try {
      await deleteFolder(folder.id)
      if (activeVaultFolder?.id === folder.id) goBackToVaultFolders()
      toast.success("Folder deleted")
    } catch {
      toast.error("Failed to delete folder")
    } finally {
      setDeleteTarget(null)
    }
  }

  const requestDelete = (folder) => {
    if (folderDisplay.confirmDelete) setDeleteTarget(folder)
    else handleDeleteFolder(folder)
  }

  /* ---------------- selection ---------------- */

  const selectionMode = selectionActive || selectedFolderIds.size > 0

  const toggleSelect = (folderId) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedFolderIds(new Set())
    setSelectionActive(false)
  }

  const toggleSelectionActive = () => {
    setSelectionActive((prev) => !prev)
    if (selectionActive) {
      setSelectedFolderIds(new Set())
    }
  }

  const selectAll = () => {
    const allVisible = [...visibleRootFolders, ...visibleChildFolders]
    setSelectedFolderIds(new Set(allVisible.map((f) => f.id)))
  }

  const selectedSubfolderCount = useMemo(() => {
    let count = 0
    for (const id of selectedFolderIds) {
      count += childrenOf(id).length
    }
    return count
  }, [selectedFolderIds, childrenOf])

  const handleBulkDelete = async ({ deleteContents }) => {
    const ids = Array.from(selectedFolderIds)
    if (ids.length === 0) return
    try {
      if (deleteContents) {
        for (const id of ids) {
          const result = await window.vaultFolderAPI.getItems(id)
          const items = result?.items || []
          for (const item of items) {
            await window.vaultAPI.delete(item.id)
          }
        }
      }
      for (const id of ids) {
        await deleteFolder(id)
      }
      if (ids.includes(activeVaultFolder?.id)) goBackToVaultFolders()
      clearSelection()
      toast.success(`${ids.length} ${ids.length === 1 ? "folder" : "folders"} deleted`)
    } catch {
      toast.error("Failed to delete folders")
    }
  }

  const handleNewSubfolder = async (folder) => {
    await openVaultFolder(folder)
    startCreating(folder.id)
  }

  const moveVaultItemToFolder = async (folderId) => {
    if (!moveItemId || !folderId) return
    try {
      await window.vaultFolderAPI.addItem(moveItemId, folderId)
      setMoveItemId(null)
      await reloadCurrent()
      toast.success("Moved to folder")
    } catch {
      toast.error("Failed to move")
    }
  }

  const removeVaultItemFromFolder = async (itemId) => {
    if (!activeVaultFolder) return
    try {
      await window.vaultFolderAPI.removeItem(itemId, activeVaultFolder.id)
      await reloadCurrent()
      toast.success("Removed from folder")
    } catch {
      toast.error("Failed to remove")
    }
  }

  const openAddItems = useCallback(async () => {
    try {
      const list = await window.vaultAPI.list({ sortOrder: "newest", search: "" })
      setAllVaultItems(Array.isArray(list) ? list : [])
    } catch {
      setAllVaultItems([])
    }
    setAddItemsSearch("")
    setAddItemsOpen(true)
  }, [])

  const addItemsToVaultFolder = async (itemIds) => {
    if (!activeVaultFolder || itemIds.length === 0) return
    try {
      for (const id of itemIds) await window.vaultFolderAPI.addItem(id, activeVaultFolder.id)
      await reloadCurrent()
      setAddItemsOpen(false)
      setAddItemsSearch("")
      toast.success(`${itemIds.length} item${itemIds.length > 1 ? "s" : ""} added`)
    } catch {
      toast.error("Failed to add items")
    }
  }

  const openVaultFolderDetails = async (folder) => {
    setDetailsFolder(folder)
    setDetailsItems([])
    setDetailsChildren([])
    try {
      const [itemsResult, children] = await Promise.all([
        window.vaultFolderAPI.getItems(folder.id),
        window.vaultFolderAPI.children(folder.id),
      ])
      setDetailsItems(itemsResult?.items || [])
      setDetailsChildren(children || [])
    } catch {
      /* ignored */
    }
  }

  /* ---------------- item actions ---------------- */

  function markCopied(id) {
    setCopied((c) => ({ ...c, [id]: true }))
    setTimeout(() => setCopied((c) => ({ ...c, [id]: false })), 1500)
  }

  /** Notes have no encrypted secret, so copy their content directly. */
  function copyNote(item) {
    navigator.clipboard.writeText(item.notes || "")
    markCopied(item.id)
    toast.success("Copied to clipboard")
  }

  async function copySecret(id) {
    try {
      const res = await window.vaultAPI.copy(id)
      if (res?.success) {
        navigator.clipboard.writeText(res.value)
        markCopied(id)
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
      await reloadCurrent()
    } catch (err) {
      toast.error("Failed to update favorite")
      console.error(err)
    }
  }

  async function handleTogglePin(id) {
    try {
      await window.vaultAPI.togglePin(id)
      await reloadCurrent()
    } catch (err) {
      toast.error("Failed to update pin")
      console.error(err)
    }
  }

  async function handleDelete(id) {
    try {
      await window.vaultAPI.delete(id)
      await reloadCurrent()
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
      setTimeout(() => setRevealed((r) => ({ ...r, [item.id]: false })), 15000)
    } catch (err) {
      toast.error("Failed to reveal value")
      console.error(err)
    }
  }

  /* ---------------- derived ---------------- */

  const query = search.trim().toLowerCase()
  const view = activeVaultFolder ? "items" : "folders"

  const folderQuery = searchInput.trim().toLowerCase()
  const visibleRootFolders = roots.filter((f) => f.name.toLowerCase().includes(folderQuery))
  const visibleChildFolders = folderQuery
    ? childFolders.filter((f) => f.name.toLowerCase().includes(folderQuery))
    : childFolders

  const visibleItems = activeVaultFolder
    ? items.filter(
        (i) =>
          i.title?.toLowerCase().includes(query) ||
          i.notes?.toLowerCase().includes(query)
      )
    : items

  const tileProps = {
    showCustomAppearance: folderDisplay.showFolderAppearance,
    showCounts: folderDisplay.showItemCounts,
    selectionMode,
    onOpen: openVaultFolder,
    onCustomize: setCustomizeFolder,
    onDelete: requestDelete,
    onDetails: openVaultFolderDetails,
    onNewSubfolder: handleNewSubfolder,
    onToggleSelect: toggleSelect,
  }

  const renderFolderGrid = (list) => (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {list.map((folder, idx) => (
        <div
          key={folder.id}
          className="animate-folder-tile"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          <FolderTile
            folder={folder}
            index={idx}
            itemCount={folderStats[folder.id] || 0}
            subfolderCount={childrenOf(folder.id).length}
            selected={selectedFolderIds.has(folder.id)}
            {...tileProps}
          />
        </div>
      ))}
    </div>
  )

  const renderItems = () => {
    if (loading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (visibleItems.length === 0) {
      return (
        <EmptyState
          icon={IconShieldLock}
          title={query ? "No matching credentials" : activeVaultFolder ? "This folder is empty" : "No credentials yet"}
          hint={
            query
              ? "Try a different search term"
              : activeVaultFolder
                ? "Add items from your vault"
                : "Click + to save your first API key or password"
          }
          action={
            !query &&
            activeVaultFolder && (
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={openAddItems}
              >
                <IconPlus size={12} /> Add items
              </Button>
            )
          }
        />
      )
    }

    const viewProps = {
      items: visibleItems,
      revealed,
      value: values,
      copied,
      attachmentCounts,
      inFolder: Boolean(activeVaultFolder),
      onCopy: (item) => (item.type === "note" ? copyNote(item) : copySecret(item.id)),
      onToggleReveal: handleToggleReveal,
      onToggleFavorite: handleToggleFavorite,
      onTogglePin: handleTogglePin,
      onDelete: handleDelete,
      onEdit: setEditItem,
      onMove: setMoveItemId,
      onRemoveFromFolder: removeVaultItemFromFolder,
    }

    switch (itemViewMode) {
      case "list":
        return <VaultListView {...viewProps} />
      case "spotlight":
        return <VaultSpotlightView {...viewProps} />
      case "grid":
      default:
        return <VaultGridView mini={mini} {...viewProps} />
    }
  }

  return (
    <div className="flex h-full select-none flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2.5 sm:px-4">
        <button
          onClick={view === "items" ? goBackToVaultFolders : () => navigate("/")}
          className="shrink-0 cursor-pointer rounded p-1 transition-colors hover:bg-accent/50"
          aria-label="Back"
        >
          <IconArrowLeft size={14} className="text-muted-foreground" />
        </button>

        <h1 className="hidden min-w-0 max-w-[140px] truncate text-sm font-semibold text-foreground sm:block">
          {view === "items" ? activeVaultFolder?.name || "Folder" : "Vault"}
        </h1>

        <div className="flex-1" />

        <div className="relative flex items-center">
          <IconSearch size={12} className="absolute left-2 text-muted-foreground" />
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
            placeholder="Search..."
            className="h-7 w-[120px] border-border/40 bg-background/60 pl-7 pr-7 text-xs sm:w-44"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("")
                setSearch("")
                searchRef.current?.focus()
              }}
              className="absolute right-2 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <IconX size={12} />
            </button>
          )}
        </div>

        <VaultViewToggle
          view={itemViewMode}
          sort={sortOrder}
          onViewChange={changeViewMode}
          onSortChange={changeSortOrder}
        />

        {view === "items" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={openAddItems}
              >
                <IconPlus size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add items</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => startCreating(activeVaultFolder?.id ?? null)}
            >
              <IconFolderPlus size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{activeVaultFolder ? "New subfolder" : "New folder"}</TooltipContent>
        </Tooltip>

        {view === "folders" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectionActive ? "secondary" : "ghost"}
                size="icon"
                className="size-7 shrink-0"
                onClick={toggleSelectionActive}
              >
                <IconCheckbox size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{selectionActive ? "Exit selection" : "Select folders"}</TooltipContent>
          </Tooltip>
        )}

        {view === "folders" && vaultFolders.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-7 shrink-0", showFolders && "bg-accent text-foreground")}
                onClick={() => setShowFolders((s) => !s)}
              >
                <IconFiles size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showFolders ? "Hide folders" : "Show folders"}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Bulk selection toolbar */}
      {selectionMode && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-muted/30 px-3 py-2 sm:px-4">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedFolderIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            onClick={selectAll}
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            onClick={clearSelection}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            onClick={() => setBulkDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      )}

      {view === "items" && (
        <FolderBreadcrumb
          breadcrumb={breadcrumb}
          activeFolder={activeVaultFolder}
          onHome={goBackToVaultFolders}
          onNavigate={openVaultFolder}
          homeIcon={IconShieldLock}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-20">
        {!encryptionAvailable && <EncryptionNotice />}

        {view === "folders" ? (
          <>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: showFolders && visibleRootFolders.length > 0 ? "600px" : "0px",
                opacity: showFolders && visibleRootFolders.length > 0 ? 1 : 0,
                transform: showFolders && visibleRootFolders.length > 0 ? "translateY(0)" : "translateY(-8px)",
              }}
            >
              {visibleRootFolders.length > 0 && (
                <div className="mb-5">
                  <SectionHeader label="Folders" count={visibleRootFolders.length} />
                  {renderFolderGrid(visibleRootFolders)}
                </div>
              )}
            </div>

            <SectionHeader label="Credentials" count={visibleItems.length} />
            {renderItems()}
          </>
        ) : (
          <>
            {visibleChildFolders.length > 0 && (
              <div className="mb-5">
                <SectionHeader label="Folders" count={visibleChildFolders.length} />
                {renderFolderGrid(visibleChildFolders)}
              </div>
            )}

            <SectionHeader
              label="Items"
              count={visibleItems.length}
              action={
                <button
                  onClick={openAddItems}
                  className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <IconPlus size={11} /> Add
                </button>
              }
            />
            {renderItems()}
          </>
        )}
      </div>

      <VaultItemDialog onSaved={reloadCurrent} />
      <VaultItemDialog
        hideTrigger
        open={Boolean(editItem)}
        onOpenChange={(o) => {
          if (!o) setEditItem(null)
        }}
        onSaved={reloadCurrent}
        item={editItem}
      />

      <VaultAddItemsDialog
        open={addItemsOpen}
        onOpenChange={setAddItemsOpen}
        items={allVaultItems}
        existingIds={activeVaultFolder ? new Set(items.map((i) => i.id)) : null}
        search={addItemsSearch}
        onSearchChange={setAddItemsSearch}
        onAdd={addItemsToVaultFolder}
        folderName={activeVaultFolder?.name}
      />

      <VaultMoveToFolderDialog
        open={Boolean(moveItemId)}
        onOpenChange={() => setMoveItemId(null)}
        folders={vaultFolders}
        currentFolderId={activeVaultFolder?.id || null}
        onSelect={moveVaultItemToFolder}
      />

      <VaultFolderDetailsDialog
        folder={detailsFolder}
        items={detailsItems}
        childFolders={detailsChildren}
        path={detailsFolder ? breadcrumbFor(detailsFolder.id) : []}
        open={Boolean(detailsFolder)}
        onOpenChange={(o) => {
          if (!o) setDetailsFolder(null)
        }}
      />

      <FolderCustomizeDialog
        folder={customizeFolder}
        title="Customize vault folder"
        open={Boolean(customizeFolder)}
        onOpenChange={(o) => {
          if (!o) setCustomizeFolder(null)
        }}
        onSave={handleSaveFolder}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
            {childrenOf(deleteTarget?.id || "").length > 0 &&
              " Its subfolders will be deleted too."}{" "}
            This action cannot be undone.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteFolder(deleteTarget)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={handleCreateFolder}
        parentId={newFolderParentId}
        existingFolders={vaultFolders}
        defaultIcon={folderDisplay.defaultIcon}
        defaultColor={folderDisplay.defaultColor}
        isSubfolder={Boolean(newFolderParentId)}
      />

      <BulkDeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        folderCount={selectedFolderIds.size}
        subfolderCount={selectedSubfolderCount}
        onDelete={handleBulkDelete}
      />
    </div>
  )
}
