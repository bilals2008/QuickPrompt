import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { toast } from "sonner"
import {
  IconArrowLeft,
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

import { FolderTile } from "@/components/collections/FolderTile"
import { FolderBreadcrumb } from "@/components/collections/FolderBreadcrumb"
import { NewFolderInput } from "@/components/collections/NewFolderInput"
import { PromptRow } from "@/components/collections/PromptRow"
import { AddPromptsDialog } from "@/components/collections/AddPromptsDialog"
import { FolderDetailsDialog } from "@/components/collections/FolderDetailsDialog"
import { FolderCustomizeDialog } from "@/components/collections/FolderCustomizeDialog"

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

  const [creatingParentId, setCreatingParentId] = useState(undefined) // undefined = not creating
  const [selectedPrompt, setSelectedPrompt] = useState(null)

  const [allPrompts, setAllPrompts] = useState([])
  const [addPromptsOpen, setAddPromptsOpen] = useState(false)
  const [addSearch, setAddSearch] = useState("")

  const [detailsFolder, setDetailsFolder] = useState(null)
  const [detailsPrompts, setDetailsPrompts] = useState([])
  const [detailsChildFolders, setDetailsChildFolders] = useState([])

  const [customizeFolder, setCustomizeFolder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [stats, setStats] = useState({ prompts: {}, subfolders: {} })
  const createAnchorRef = useRef(null)

  const childFolders = activeFolder ? childrenOf(activeFolder.id) : []
  const breadcrumb = useMemo(
    () => (activeFolder ? breadcrumbFor(activeFolder.id) : []),
    [activeFolder, breadcrumbFor]
  )

  const creatingParent = creatingParentId === undefined ? undefined : creatingParentId
  const isCreating = creatingParent !== undefined

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
      setSelectedPrompt(null)
      setSearchQuery("")
      setCreatingParentId(undefined)
      await loadFolderPrompts(folder.id)
    },
    [loadFolderPrompts]
  )

  const goHome = useCallback(() => {
    setView("folders")
    setActiveFolder(null)
    setPrompts([])
    setSelectedPrompt(null)
    setSearchQuery("")
    setCreatingParentId(undefined)
  }, [])

  /* ---------------- folder mutations ---------------- */

  const startCreating = (parentId) => {
    setCreatingParentId(parentId)
    setTimeout(() => createAnchorRef.current?.scrollIntoView?.({ block: "nearest" }), 50)
  }

  const handleCreateFolder = async (name) => {
    try {
      await createFolder({
        name,
        parentId: creatingParent ?? null,
        icon: folderDisplay.defaultIcon,
        color: folderDisplay.defaultColor,
      })
      setCreatingParentId(undefined)
      toast.success(creatingParent ? "Subfolder created" : "Folder created")
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
    onOpen: openFolder,
    onCustomize: setCustomizeFolder,
    onDelete: requestDelete,
    onDetails: openDetails,
    onNewSubfolder: handleNewSubfolder,
  }

  const renderFolderGrid = (list) => (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {list.map((folder, idx) => (
        <FolderTile
          key={folder.id}
          folder={folder}
          index={idx}
          promptCount={stats.prompts[folder.id] || 0}
          subfolderCount={stats.subfolders[folder.id] || 0}
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
      </div>

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
        {isCreating && (
          <div ref={createAnchorRef}>
            <NewFolderInput
              icon={folderDisplay.defaultIcon}
              color={folderDisplay.defaultColor}
              placeholder={creatingParent ? "New Subfolder" : "New Folder"}
              onSubmit={handleCreateFolder}
              onCancel={() => setCreatingParentId(undefined)}
            />
          </div>
        )}

        {view === "folders" ? (
          visibleFolders.length === 0 && !isCreating ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <IconFolderFilled size={48} className="text-muted-foreground/20" strokeWidth={1} />
              <p className="text-xs text-muted-foreground/60">
                {query ? "No matching folders" : "No folders yet"}
              </p>
              {!query && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => startCreating(null)}
                >
                  <IconFolderPlus size={12} /> Create Folder
                </Button>
              )}
            </div>
          ) : (
            renderFolderGrid(visibleFolders)
          )
        ) : loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <>
            {activeChildFolders.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Folders
                </p>
                {renderFolderGrid(activeChildFolders)}
              </div>
            )}

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Prompts ({filteredPrompts.length})
            </p>
            {filteredPrompts.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <IconFiles size={32} className="text-muted-foreground/20" strokeWidth={1} />
                <p className="text-xs text-muted-foreground/60">
                  {query ? "No matching prompts" : "Folder is empty"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredPrompts.map((prompt, idx) => (
                  <PromptRow
                    key={prompt.id}
                    prompt={prompt}
                    index={idx}
                    onCopy={copyPrompt}
                    onRemove={() => removePromptFromFolder(prompt.id)}
                    onToggleFavorite={() => toggleFavorite(prompt.id)}
                    isSelected={selectedPrompt === prompt.id}
                    onSelect={() => setSelectedPrompt(prompt.id)}
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
    </div>
  )
}
