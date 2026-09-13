import { useState, useEffect, useCallback, useRef } from "react"
import { useOutletContext, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  IconFolderFilled, IconFolderPlus, IconSearch, IconX,
  IconChevronRight, IconDotsVertical, IconEdit,
  IconTrash, IconCopy, IconStar, IconInfoCircle,
  IconStarFilled, IconRefresh, IconArrowLeft, IconFiles, IconPlus, IconCheck,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export default function CollectionsPage() {
  useOutletContext()
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [rootFolders, setRootFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState([])
  const [view, setView] = useState("folders") // "folders" | "prompts"
  const [addPromptsOpen, setAddPromptsOpen] = useState(false)
  const [allPrompts, setAllPrompts] = useState([])
  const [addSearch, setAddSearch] = useState("")
  const [detailsFolder, setDetailsFolder] = useState(null)
  const [detailsPrompts, setDetailsPrompts] = useState([])
  const [detailsChildFolders, setDetailsChildFolders] = useState([])
  const createInputRef = useRef(null)

  const loadFolders = useCallback(async () => {
    const all = await window.folderAPI.list()
    setFolders(all || [])
    const roots = all.filter((f) => !f.parent_id)
    setRootFolders(roots)
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const loadAllPrompts = useCallback(async () => {
    const result = await window.db.getAllPrompts()
    setAllPrompts(result || [])
  }, [])

  useEffect(() => { loadAllPrompts() }, [loadAllPrompts])

  const loadFolderPrompts = useCallback(async (folderId) => {
    setLoading(true)
    try {
      const result = await window.folderAPI.getPrompts(folderId)
      setPrompts(result?.prompts || [])
    } catch { setPrompts([]) }
    setLoading(false)
  }, [])

  const loadBreadcrumb = useCallback(async (folderId) => {
    if (!folderId) { setBreadcrumb([]); return }
    const bc = await window.folderAPI.breadcrumb(folderId)
    setBreadcrumb(bc || [])
  }, [])

  const openFolder = useCallback(async (folder) => {
    setActiveFolder(folder)
    setCreating(false)
    setView("prompts")
    await loadFolderPrompts(folder.id)
    await loadBreadcrumb(folder.id)
  }, [loadFolderPrompts, loadBreadcrumb])

  const goBackToFolders = () => {
    setView("folders")
    setActiveFolder(null)
    setPrompts([])
    setBreadcrumb([])
    setSearchQuery("")
    setCreating(false)
  }

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await window.folderAPI.create({
        name: newFolderName.trim(),
        parentId: activeFolder?.id || null,
      })
      setNewFolderName("")
      setCreating(false)
      await loadFolders()
      toast.success("Folder created")
    } catch { toast.error("Failed to create folder") }
  }

  const renameFolder = async (id, name) => {
    try {
      await window.folderAPI.rename(id, name)
      await loadFolders()
      if (activeFolder?.id === id) {
        setActiveFolder((p) => p ? { ...p, name } : p)
        setBreadcrumb((p) => p.map((b) => b.id === id ? { ...b, name } : b))
      }
      toast.success("Renamed")
    } catch { toast.error("Failed") }
  }

  const deleteFolder = async (id) => {
    try {
      await window.folderAPI.delete(id)
      await loadFolders()
      if (activeFolder?.id === id) goBackToFolders()
      toast.success("Deleted")
    } catch { toast.error("Failed") }
  }

  const removePromptFromFolder = async (promptId) => {
    if (!activeFolder) return
    try {
      await window.folderAPI.removePrompt(promptId, activeFolder.id)
      await loadFolderPrompts(activeFolder.id)
      toast.success("Removed")
    } catch { toast.error("Failed") }
  }

  const addPromptsToFolder = async (promptIds) => {
    if (!activeFolder || promptIds.length === 0) return
    try {
      for (const pid of promptIds) {
        await window.folderAPI.addPrompt(pid, activeFolder.id)
      }
      await loadFolderPrompts(activeFolder.id)
      setAddPromptsOpen(false)
      setAddSearch("")
      toast.success(`${promptIds.length} prompt${promptIds.length > 1 ? "s" : ""} added`)
    } catch { toast.error("Failed") }
  }

  const openDetails = async (folder) => {
    setDetailsFolder(folder)
    try {
      const [promptsResult, children] = await Promise.all([
        window.folderAPI.getPrompts(folder.id),
        window.folderAPI.children(folder.id),
      ])
      setDetailsPrompts(promptsResult?.prompts || [])
      setDetailsChildFolders(children || [])
    } catch { setDetailsPrompts([]); setDetailsChildFolders([]) }
  }

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied")
  }

  const toggleFavorite = async (id) => {
    try {
      await window.db.toggleFavorite(id)
      if (activeFolder) await loadFolderPrompts(activeFolder.id)
    } catch { /* ignored */ }
  }

  const filteredPrompts = prompts.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFolders = (activeFolder
    ? rootFolders.filter((f) => f.parent_id === activeFolder?.id)
    : rootFolders
  ).filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sub-folders inside the current folder
  const childFolders = folders.filter((f) => f.parent_id === activeFolder?.id)

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2.5">
        {view === "prompts" ? (
          <button onClick={goBackToFolders} className="shrink-0 p-1 rounded hover:bg-accent/50 transition-colors cursor-pointer">
            <IconArrowLeft size={14} className="text-muted-foreground" />
          </button>
        ) : (
          <button onClick={() => navigate("/")} className="shrink-0 p-1 rounded hover:bg-accent/50 transition-colors cursor-pointer">
            <IconArrowLeft size={14} className="text-muted-foreground" />
          </button>
        )}
        <h1 className="text-sm font-semibold text-foreground min-w-0 truncate">
          {view === "prompts" ? activeFolder?.name || "Folder" : "Collections"}
        </h1>
        <div className="flex-1 min-w-0" />
        <div className="relative flex items-center shrink-0">
          <IconSearch size={12} className="absolute left-2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={view === "prompts" ? "Search in folder..." : "Search folders..."}
            className="h-7 w-36 sm:w-44 pl-7 pr-7 text-xs border-border/40 bg-background/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer">
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
                className="h-7 w-7"
                onClick={() => { loadAllPrompts(); setAddPromptsOpen(true) }}
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
              className="h-7 w-7"
              onClick={() => {
                setCreating(true)
                setNewFolderName("New Folder")
                setTimeout(() => createInputRef.current?.select(), 50)
              }}
            >
              <IconFolderPlus size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Folder</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                loadFolders()
                if (activeFolder) loadFolderPrompts(activeFolder.id)
              }}
            >
              <IconRefresh size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </div>

      {/* Breadcrumb when inside folder */}
      {view === "prompts" && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/20 text-xs">
          <button onClick={goBackToFolders} className="shrink-0 hover:bg-accent/60 rounded px-1 py-0.5 transition-colors cursor-pointer text-muted-foreground">
            <IconFiles size={11} />
          </button>
          {breadcrumb.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1 shrink-0">
              <IconChevronRight size={9} className="text-muted-foreground/40" />
              <button
                onClick={async () => {
                  if (b.id === activeFolder?.id) return
                  const folder = folders.find((f) => f.id === b.id) || b
                  await openFolder(folder)
                }}
                className={cn(
                  "hover:bg-accent/60 rounded px-1 py-0.5 transition-colors cursor-pointer",
                  i === breadcrumb.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* New folder inline input - only on root folders view */}
        {creating && view === "folders" && (
          <div className="flex items-center gap-2 mb-3 animate-in fade-in" style={{ animationDuration: "0.15s" }}>
            <IconFolderFilled size={20} className="text-yellow-500/80 shrink-0" />
            <input
              ref={createInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => { if (newFolderName.trim()) createNewFolder(); else setCreating(false) }}
              onKeyDown={(e) => {
                if (e.key === "Enter") createNewFolder()
                if (e.key === "Escape") { setCreating(false); setNewFolderName("") }
              }}
              className="flex-1 min-w-0 bg-transparent border-b border-ring/50 px-1 py-0.5 text-xs outline-none"
              autoFocus
            />
          </div>
        )}

        {view === "folders" ? (
          /* FOLDER GRID */
          filteredFolders.length === 0 && !creating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <IconFolderFilled size={48} className="text-muted-foreground/20" strokeWidth={1} />
              <p className="text-xs text-muted-foreground/60">No folders yet</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => {
                setCreating(true)
                setNewFolderName("New Folder")
                setTimeout(() => createInputRef.current?.select(), 50)
              }}>
                <IconFolderPlus size={12} /> Create Folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
              {filteredFolders.map((folder, idx) => (
                <FolderTile
                  key={folder.id}
                  folder={folder}
                  index={idx}
                  onOpen={openFolder}
                  onRename={renameFolder}
                  onDelete={deleteFolder}
                  onDetails={openDetails}
                />
              ))}
            </div>
          )
        ) : (
          /* PROMPTS LIST */
          loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Sub-folders inside current folder */}
              {childFolders.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Folders</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {childFolders.map((folder, idx) => (
                      <FolderTile
                        key={folder.id}
                        folder={folder}
                        index={idx}
                        onOpen={openFolder}
                        onRename={renameFolder}
                        onDelete={deleteFolder}
                        onDetails={openDetails}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Prompts */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                Prompts ({filteredPrompts.length})
              </p>
              {filteredPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <IconFiles size={32} className="text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-xs text-muted-foreground/60">
                    {searchQuery ? "No matching prompts" : "Folder is empty"}
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
          )
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/20 text-[10px] text-muted-foreground/60">
        <span>
          {view === "folders"
            ? `${filteredFolders.length} folders`
            : `${filteredPrompts.length} prompts`
          }
        </span>
      </div>

      {/* Add prompts dialog */}
      <AddPromptsDialog
        open={addPromptsOpen}
        onOpenChange={setAddPromptsOpen}
        allPrompts={allPrompts}
        folderPrompts={prompts}
        search={addSearch}
        onSearchChange={setAddSearch}
        onAdd={addPromptsToFolder}
      />

      {/* Folder details dialog */}
      <FolderDetailsDialog
        folder={detailsFolder}
        prompts={detailsPrompts}
        childFolders={detailsChildFolders}
        open={Boolean(detailsFolder)}
        onOpenChange={(o) => { if (!o) setDetailsFolder(null) }}
      />
    </div>
  )
}

function AddPromptsDialog({ open, onOpenChange, allPrompts, folderPrompts, search, onSearchChange, onAdd }) {
  const [selected, setSelected] = useState([])
  const folderPromptIds = new Set(folderPrompts.map((p) => p.id))
  const available = allPrompts.filter((p) => !folderPromptIds.has(p.id))
  const filtered = available.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleAdd = () => {
    if (selected.length === 0) return
    onAdd(selected)
    setSelected([])
  }

  useEffect(() => {
    if (!open) { setSelected([]); onSearchChange("") }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border/30">
          <DialogTitle className="text-sm">Add prompts to folder</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-2">
          <div className="relative">
            <IconSearch size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search prompts..."
              className="h-7 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-6">
              {available.length === 0 ? "All prompts already in this folder" : "No matching prompts"}
            </p>
          ) : (
            filtered.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => toggle(prompt.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer",
                  "hover:bg-accent/40",
                  selected.includes(prompt.id) && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  selected.includes(prompt.id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border/60"
                )}>
                  {selected.includes(prompt.id) && <IconCheck size={10} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{prompt.title || "Untitled"}</p>
                  <p className="text-[10px] truncate text-muted-foreground/60">{prompt.content?.slice(0, 60)}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/60">{selected.length} selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" disabled={selected.length === 0} onClick={handleAdd}>
              Add{selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FolderTile({ folder, index, onOpen, onRename, onDelete, onDetails }) {
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const inputRef = useRef(null)

  const confirmRename = () => {
    if (renameValue.trim() && renameValue.trim() !== folder.name) {
      onRename(folder.id, renameValue.trim())
    }
    setRenaming(false)
  }

  return (
    <div
      className="group relative flex flex-col items-center gap-1 rounded-lg border border-border/30 bg-card/50 cursor-pointer transition-all duration-200 hover:border-border/60 hover:bg-accent/30 hover:shadow-sm p-2 overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: "backwards" }}
      onDoubleClick={() => onOpen(folder)}
    >
      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-accent cursor-pointer z-10"
          >
            <IconDotsVertical size={12} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => { setRenaming(true); setRenameValue(folder.name); setTimeout(() => inputRef.current?.select(), 50) }} className="gap-2 text-xs">
            <IconEdit size={12} /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDetails(folder)} className="gap-2 text-xs">
            <IconInfoCircle size={12} /> Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(folder.id)} className="gap-2 text-xs text-destructive">
            <IconTrash size={12} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Folder icon */}
      {folder.color ? (
        <IconFolderFilled size={28} style={{ color: folder.color }} className="transition-transform group-hover:scale-110 duration-200" strokeWidth={1.5} />
      ) : (
        <IconFolderFilled size={28} className="text-yellow-500/80 transition-transform group-hover:scale-110 duration-200" strokeWidth={1.5} />
      )}

      {/* Name */}
      {renaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={confirmRename}
          onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenaming(false) }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-full bg-background border border-ring/50 rounded px-1.5 py-0.5 text-center text-[10px] outline-none"
          autoFocus
        />
      ) : (
        <p className="text-[10px] font-medium text-center w-full min-w-0 truncate text-muted-foreground group-hover:text-foreground transition-colors">
          {folder.name}
        </p>
      )}
    </div>
  )
}

function PromptRow({ prompt, index, onCopy, onRemove, onToggleFavorite, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-150",
        "hover:bg-accent/40",
        isSelected && "bg-accent/60 ring-1 ring-primary/30"
      )}
      style={{ animationDelay: `${Math.min(index * 15, 200)}ms`, animationFillMode: "backwards" }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
        className="shrink-0 cursor-pointer"
      >
        {prompt.favorite ? (
          <IconStarFilled size={12} className="text-amber-400" />
        ) : (
          <IconStar size={12} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">{prompt.title || "Untitled"}</p>
        <p className="text-[10px] truncate text-muted-foreground/60 mt-0.5">{prompt.content?.slice(0, 100)}</p>
      </div>
      {prompt.tags && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {prompt.tags.split(",").slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">{tag.trim()}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onCopy(prompt.content) }} className="p-1 rounded hover:bg-accent transition-colors cursor-pointer" title="Copy">
          <IconCopy size={11} className="text-muted-foreground" />
        </button>
        {onRemove && (
          <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="p-1 rounded hover:bg-accent transition-colors cursor-pointer" title="Remove">
            <IconX size={11} className="text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}

function FolderDetailsDialog({ folder, prompts, childFolders, open, onOpenChange }) {
  if (!folder) return null
  const created = folder.created_at ? new Date(folder.created_at) : null
  const modified = folder.updated_at ? new Date(folder.updated_at) : null
  const fmt = (d) => d ? d.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }) : "—"
  const parts = []
  if (prompts.length > 0) parts.push(`${prompts.length} Prompt${prompts.length !== 1 ? "s" : ""}`)
  if (childFolders.length > 0) parts.push(`${childFolders.length} Folder${childFolders.length !== 1 ? "s" : ""}`)
  const contains = parts.length > 0 ? parts.join(", ") : "Empty"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-80">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="text-sm flex items-center gap-2">
            <IconFolderFilled size={18} className="text-yellow-500/80 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-2 text-xs">
          <div className="flex items-center gap-3 py-1">
            <span className="text-muted-foreground w-20 shrink-0">Type:</span>
            <span className="text-foreground">File folder</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="text-muted-foreground w-20 shrink-0">Contains:</span>
            <span className="text-foreground">{contains}</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="text-muted-foreground w-20 shrink-0">Created:</span>
            <span className="text-foreground">{fmt(created)}</span>
          </div>
          <div className="flex items-center gap-3 py-1">
            <span className="text-muted-foreground w-20 shrink-0">Modified:</span>
            <span className="text-foreground">{fmt(modified)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
