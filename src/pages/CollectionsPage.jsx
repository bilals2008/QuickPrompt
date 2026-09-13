import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconCheckbox,
  IconFiles,
  IconFolderFilled,
  IconFolderPlus,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { FolderTile } from "@/components/folders/FolderTile"
import { PromptRow } from "@/components/collections/PromptRow"
import { AddPromptsDialog } from "@/components/collections/AddPromptsDialog"
import { FolderDetailsDialog } from "@/components/collections/FolderDetailsDialog"
import { FolderBreadcrumb } from "@/components/folders/FolderBreadcrumb"
import { NewFolderDialog } from "@/components/folders/NewFolderDialog"
import { BulkDeleteConfirmDialog } from "@/components/folders/BulkDeleteConfirmDialog"
import { FolderCustomizeDialog } from "@/components/folders/FolderCustomizeDialog"
import { SectionHeader } from "@/components/section-header"
import { EmptyState } from "@/components/empty-state"

import { useFolders } from "@/hooks/useFolders"
import { useFolderDisplaySettings } from "@/hooks/useFolderDisplaySettings"

export default function CollectionsPage() {
  useOutletContext()
  const navigate = useNavigate()

  const [folderDisplay] = useFolderDisplaySettings()

  const {
    folders,
    roots,
    byId,
    childrenOf,
    createFolder,
    updateFolder,
    deleteFolder,
    promptsInFolder,
    breadcrumbFor,
    reload,
  } = useFolders()

  const [view, setView] = useState("folders") // "folders" | "prompts"
  const [activeFolder, setActiveFolder] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderParentId, setNewFolderParentId] = useState(null)

  const [allPrompts, setAllPrompts] = useState([])
  const [addPromptsOpen, setAddPromptsOpen] = useState(false)
  const [addSearch, setAddSearch] = useState("")

  const [detailsFolder, setDetailsFolder] = useState(null)
  const [detailsPrompts, setDetailsPrompts] = useState([])
  const [detailsChildFolders, setDetailsChildFolders] = useState([])

  const [customizeFolder, setCustomizeFolder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedFolderIds, setSelectedFolderIds] = useState(new Set())
  const [selectionActive, setSelectionActive] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const [stats, setStats] = useState({ prompts: {}, subfolders: {} })

  const childFolders = activeFolder ? childrenOf(activeFolder.id) : []
  const breadcrumb = useMemo(
    () => (activeFolder ? breadcrumbFor(activeFolder.id) : []),
    [activeFolder, breadcrumbFor]
  )

  /* ---------------- data loading ---------------- */

  const loadFolderPrompts = useCallback(
    async (folderId) => {
      setLoading(true)
      try {
        setPrompts(await promptsInFolder(folderId))
      } catch {
        setPrompts([])
      } finally {
        setLoading(false)
      }
    },
    [promptsInFolder]
  )

  const loadAllPrompts = useCallback(async () => {
    try {
      const result = await window.db.getAllPrompts()
      setAllPrompts(result || [])
    } catch {
      setAllPrompts([])
    }
  }, [])

  // Lightweight per-folder counts for the tile badges.
  useEffect(() => {
    if (!folderDisplay.showItemCounts || folders.length === 0) {
      setStats({ prompts: {}, subfolders: {} })
      return
    }
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        folders.map(async (f) => {
          try {
            const r = await window.folderAPI.getPrompts(f.id)
            return [f.id, r?.total ?? 0]
          } catch {
            return [f.id, 0]
          }
        })
      )
      if (cancelled) return
      const subfolders = {}
      for (const f of folders) {
        if (f.parent_id) subfolders[f.parent_id] = (subfolders[f.parent_id] || 0) + 1
      }
      setStats({ prompts: Object.fromEntries(entries), subfolders })
    })()
    return () => {
      cancelled = true
    }
  }, [folders, folderDisplay.showItemCounts])

  /* ---------------- navigation ---------------- */

  const openFolder = useCallback(
    async (folder) => {
      if (!folder) return
      setActiveFolder(folder)
      setView("prompts")
      setSearchQuery("")
      setNewFolderOpen(false)
      setSelectedFolderIds(new Set())
      await loadFolderPrompts(folder.id)
    },
    [loadFolderPrompts]
  )

  const goHome = useCallback(() => {
    setView("folders")
    setActiveFolder(null)
    setPrompts([])
    setSearchQuery("")
    setNewFolderOpen(false)
    setSelectedFolderIds(new Set())
  }, [])

  /* ---------------- folder mutations ---------------- */

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
      if (updated && activeFolder?.id === id) setActiveFolder(updated)
      toast.success("Folder updated")
    } catch {
      toast.error("Failed to update folder")
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!folder) return
    try {
      await deleteFolder(folder.id)
      if (activeFolder?.id === folder.id) goHome()
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
    setSelectedFolderIds(new Set(visibleFolders.map((f) => f.id)))
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
          const result = await window.folderAPI.getPrompts(id)
          const promptIds = (result?.prompts || []).map((p) => p.id)
          for (const pid of promptIds) {
            await window.db.deletePrompt(pid)
          }
        }
      }
      for (const id of ids) {
        await deleteFolder(id)
      }
      if (ids.includes(activeFolder?.id)) goHome()
      clearSelection()
      toast.success(`${ids.length} ${ids.length === 1 ? "folder" : "folders"} deleted`)
    } catch {
      toast.error("Failed to delete folders")
    }
  }

  const handleNewSubfolder = async (folder) => {
    await openFolder(folder)
    startCreating(folder.id)
  }

  /* ---------------- prompt mutations ---------------- */

  const removePromptFromFolder = async (promptId) => {
    if (!activeFolder) return
    try {
      await window.folderAPI.removePrompt(promptId, activeFolder.id)
      await loadFolderPrompts(activeFolder.id)
      toast.success("Removed")
    } catch {
      toast.error("Failed to remove prompt")
    }
  }

  const addPromptsToFolder = async (promptIds) => {
    if (!activeFolder || promptIds.length === 0) return
    try {
      for (const pid of promptIds) await window.folderAPI.addPrompt(pid, activeFolder.id)
      await loadFolderPrompts(activeFolder.id)
      setAddPromptsOpen(false)
      setAddSearch("")
      toast.success(`${promptIds.length} prompt${promptIds.length > 1 ? "s" : ""} added`)
    } catch {
      toast.error("Failed to add prompts")
    }
  }

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied")
  }

  const toggleFavorite = async (id) => {
    try {
      await window.db.toggleFavorite(id)
      if (activeFolder) await loadFolderPrompts(activeFolder.id)
    } catch {
      /* ignored */
    }
  }

  const openDetails = async (folder) => {
    setDetailsFolder(folder)
    setDetailsPrompts([])
    setDetailsChildFolders([])
    try {
      const [promptsResult, children] = await Promise.all([
        window.folderAPI.getPrompts(folder.id),
        window.folderAPI.children(folder.id),
      ])
      setDetailsPrompts(promptsResult?.prompts || [])
      setDetailsChildFolders(children || [])
    } catch {
      /* ignored */
    }
  }

  /* ---------------- filtering ---------------- */

  const query = searchQuery.trim().toLowerCase()

  const visibleFolders = (view === "folders" ? roots : childFolders).filter((f) =>
    f.name.toLowerCase().includes(query)
  )

  const filteredPrompts = prompts.filter(
    (p) =>
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query) ||
      p.tags?.toLowerCase().includes(query)
  )

  const activeChildFolders = query
    ? childFolders.filter((f) => f.name.toLowerCase().includes(query))
    : childFolders

  const tileProps = {
    showCustomAppearance: folderDisplay.showFolderAppearance,
    showCounts: folderDisplay.showItemCounts,
    selectionMode,
    onOpen: openFolder,
    onCustomize: setCustomizeFolder,
    onDelete: requestDelete,
    onDetails: openDetails,
    onNewSubfolder: handleNewSubfolder,
    onToggleSelect: toggleSelect,
  }

  const renderFolderGrid = (list) => (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {list.map((folder, idx) => (
        <FolderTile
          key={folder.id}
          folder={folder}
          index={idx}
          itemCount={stats.prompts[folder.id] || 0}
          subfolderCount={stats.subfolders[folder.id] || 0}
          selected={selectedFolderIds.has(folder.id)}
          {...tileProps}
        />
      ))}
    </div>
  )

  return (
    <div className="flex h-full select-none flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2.5 sm:px-4">
        <button
          onClick={view === "prompts" ? goHome : () => navigate("/")}
          className="shrink-0 rounded p-1 transition-colors hover:bg-accent/50 cursor-pointer"
          aria-label="Back"
        >
          <IconArrowLeft size={14} className="text-muted-foreground" />
        </button>

        <h1 className="hidden min-w-0 max-w-[140px] truncate text-sm font-semibold text-foreground sm:block">
          {view === "prompts" ? activeFolder?.name || "Folder" : "Collections"}
        </h1>

        <div className="flex-1" />

        <div className="relative flex items-center">
          <IconSearch size={12} className="absolute left-2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={view === "prompts" ? "Search..." : "Search..."}
            className="h-7 w-[120px] border-border/40 bg-background/60 pl-7 pr-7 text-xs sm:w-44"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <IconX size={12} />
            </button>
          )}
        </div>

        {view === "prompts" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => {
                  loadAllPrompts()
                  setAddPromptsOpen(true)
                }}
              >
                <IconPlus size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add prompts</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => startCreating(activeFolder?.id ?? null)}
            >
              <IconFolderPlus size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{activeFolder ? "New subfolder" : "New folder"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => {
                reload()
                if (activeFolder) loadFolderPrompts(activeFolder.id)
              }}
            >
              <IconRefresh size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
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
      </div>

      {/* Bulk selection toolbar */}
      {selectionMode && view === "folders" && (
        <div className="flex items-center gap-2 border-b border-border/30 bg-muted/30 px-3 py-2 sm:px-4">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedFolderIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            onClick={selectedFolderIds.size === visibleFolders.length ? clearSelection : selectAll}
          >
            {selectedFolderIds.size === visibleFolders.length ? "Deselect all" : "Select all"}
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

      {view === "prompts" && (
        <FolderBreadcrumb
          breadcrumb={breadcrumb}
          activeFolder={activeFolder}
          onHome={goHome}
          onNavigate={openFolder}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {view === "folders" ? (
          visibleFolders.length === 0 && !newFolderOpen ? (
            <EmptyState
              className="py-14"
              icon={IconFolderFilled}
              title={query ? "No folders match" : "No folders yet"}
              hint={query ? "Try a different search term" : "Folders keep your prompts organized"}
              action={
                !query && (
                  <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => startCreating(null)}>
                    <IconFolderPlus size={12} /> Create folder
                  </Button>
                )
              }
            />
          ) : (
            <>
              <SectionHeader label="Folders" count={visibleFolders.length} />
              {renderFolderGrid(visibleFolders)}
            </>
          )
        ) : loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <>
            {activeChildFolders.length > 0 && (
              <div className="mb-5">
                <SectionHeader label="Folders" count={activeChildFolders.length} />
                {renderFolderGrid(activeChildFolders)}
              </div>
            )}

            <SectionHeader
              label="Prompts"
              count={filteredPrompts.length}
              action={
                <button
                  onClick={() => {
                    loadAllPrompts()
                    setAddPromptsOpen(true)
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <IconPlus size={11} /> Add
                </button>
              }
            />
            {filteredPrompts.length === 0 ? (
              <EmptyState
                icon={IconFiles}
                title={query ? "No matching prompts" : "This folder is empty"}
                hint={query ? "Try a different search term" : "Add prompts from your library"}
                action={
                  !query && (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => {
                        loadAllPrompts()
                        setAddPromptsOpen(true)
                      }}
                    >
                      <IconPlus size={12} /> Add prompts
                    </Button>
                  )
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredPrompts.map((prompt) => (
                  <PromptRow
                    key={prompt.id}
                    prompt={prompt}
                    onCopy={copyPrompt}
                    onRemove={() => removePromptFromFolder(prompt.id)}
                    onToggleFavorite={() => toggleFavorite(prompt.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border/20 px-4 py-1.5 text-[10px] text-muted-foreground/60">
        <span>
          {view === "folders"
            ? `${visibleFolders.length} folder${visibleFolders.length === 1 ? "" : "s"}`
            : `${filteredPrompts.length} prompt${filteredPrompts.length === 1 ? "" : "s"}`
              + (activeChildFolders.length > 0
                ? ` · ${activeChildFolders.length} subfolder${activeChildFolders.length === 1 ? "" : "s"}`
                : "")}
        </span>
        {view === "prompts" && activeFolder?.parent_id && byId[activeFolder.parent_id] && (
          <button
            onClick={() => openFolder(byId[activeFolder.parent_id])}
            className="cursor-pointer hover:text-foreground"
          >
            Go to parent
          </button>
        )}
      </div>

      <AddPromptsDialog
        open={addPromptsOpen}
        onOpenChange={setAddPromptsOpen}
        allPrompts={allPrompts}
        folderPrompts={prompts}
        search={addSearch}
        onSearchChange={setAddSearch}
        onAdd={addPromptsToFolder}
      />

      <FolderDetailsDialog
        folder={detailsFolder}
        prompts={detailsPrompts}
        childFolders={detailsChildFolders}
        path={detailsFolder ? breadcrumbFor(detailsFolder.id) : []}
        open={Boolean(detailsFolder)}
        onOpenChange={(o) => {
          if (!o) setDetailsFolder(null)
        }}
      />

      <FolderCustomizeDialog
        folder={customizeFolder}
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
            {(stats.subfolders[deleteTarget?.id] || 0) > 0 &&
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
        existingFolders={folders}
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
