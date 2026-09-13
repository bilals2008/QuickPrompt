import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { IconLock, IconKey, IconShieldLock, IconNote, IconCreditCard, IconEye, IconEyeOff, IconPlus, IconX, IconPalette, IconLink, IconPaperclip, IconFile, IconDownload, IconFolderFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FolderSelect, NO_FOLDER } from "@/components/folders/FolderSelect"
import { parseTagsString, splitTagInput } from "@/lib/tag-utils"
import { getTagColor } from "@/lib/tag-colors"
import { getVaultTypeFields, readVaultField, cardLast4 } from "@/lib/vault-types"
import { cn } from "@/lib/utils"

export const VAULT_TYPES = [
  { id: "api_key", label: "API Key", icon: IconKey, color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400", activeColor: "bg-blue-500/20 text-blue-600 border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25" },
  { id: "password", label: "Password", icon: IconLock, color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400", activeColor: "bg-purple-500/20 text-purple-600 border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25" },
  { id: "token", label: "Token", icon: IconShieldLock, color: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400", activeColor: "bg-green-500/20 text-green-600 border-green-500/30 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/25" },
  { id: "card", label: "Card", icon: IconCreditCard, color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400", activeColor: "bg-amber-500/20 text-amber-600 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25" },
  { id: "note", label: "Note", icon: IconNote, color: "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400", activeColor: "bg-pink-500/20 text-pink-600 border-pink-500/30 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/25" },
]

export function getVaultType(id) {
  return VAULT_TYPES.find((t) => t.id === id) || VAULT_TYPES[VAULT_TYPES.length - 1]
}

const CARD_TINTS = [
  { id: "yellow", label: "Yellow", light: "#fef9c3", dark: "rgba(254, 240, 138, 0.15)" },
  { id: "green", label: "Green", light: "#dcfce7", dark: "rgba(134, 239, 172, 0.15)" },
  { id: "blue", label: "Blue", light: "#dbeafe", dark: "rgba(147, 197, 253, 0.15)" },
  { id: "pink", label: "Pink", light: "#fce7f3", dark: "rgba(244, 114, 182, 0.15)" },
  { id: "purple", label: "Purple", light: "#f3e8ff", dark: "rgba(192, 132, 252, 0.15)" },
  { id: "orange", label: "Orange", light: "#ffedd5", dark: "rgba(251, 146, 60, 0.15)" },
  { id: "teal", label: "Teal", light: "#ccfbf1", dark: "rgba(45, 212, 191, 0.15)" },
  { id: "rose", label: "Rose", light: "#ffe4e6", dark: "rgba(251, 113, 133, 0.15)" },
]

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function VaultItemDialog({ open, onOpenChange, onSaved, item = null, hideTrigger = false }) {
  const isEditing = Boolean(item)
  const controlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlled ? open : internalOpen
  const [title, setTitle] = useState("")
  const [type, setType] = useState("api_key")
  const [value, setValue] = useState("")
  const [notes, setNotes] = useState("")
  const [meta, setMeta] = useState({})
  const [url, setUrl] = useState("")
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState("")
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [colorBg, setColorBg] = useState("")
  const [colorText, setColorText] = useState("")
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [vaultFolders, setVaultFolders] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(NO_FOLDER)
  const titleRef = useRef(null)
  const fileInputRef = useRef(null)

  function setOpen(next) {
    if (controlled) {
      onOpenChange?.(next)
    } else {
      setInternalOpen(next)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTitle(item?.title || "")
      setType(item?.type || "api_key")
      setValue("")
      setNotes(item?.notes || "")
      setMeta(item?.meta || {})
      setUrl(item?.url || "")
      setTags(Array.isArray(item?.tags) ? item.tags : [])
      setTagInput("")
      setShowValue(false)
      setColorBg(item?.color_bg || "")
      setColorText(item?.color_text || "")
      setColorPickerOpen(false)
      setAttachments([])
      setSelectedFolderId(NO_FOLDER)
      if (item?.id) {
        window.vaultAPI?.listAttachments(item.id).then(setAttachments).catch(() => {})
        // Pre-select the folder the item already lives in, if any.
        window.vaultFolderAPI
          ?.getItemFolders?.(item.id)
          .then((folders) => {
            if (Array.isArray(folders) && folders.length > 0) setSelectedFolderId(folders[0].id)
          })
          .catch(() => {})
      }
      window.vaultFolderAPI?.list().then((f) => setVaultFolders(f || [])).catch(() => {})
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [isOpen, item])

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    setTagInput("")
    if (tags.includes(t)) {
      setTags(tags.filter((tag) => tag !== t))
      return
    }
    setTags([...tags, t])
  }

  function handleTagInputChange(e) {
    const value = e.target.value
    const { completeTags, remaining } = splitTagInput(value)
    if (completeTags.length > 0) {
      const fresh = completeTags.filter((t) => !tags.includes(t))
      if (fresh.length > 0) setTags((prev) => [...new Set([...prev, ...fresh])])
      setTagInput(remaining)
      return
    }
    setTagInput(value)
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (!isEditing) {
      const missing = typeFields.find(
        (f) => f.required && !readVaultField(form, f.key).trim()
      )
      if (missing) {
        toast.error(`Please enter ${missing.label.toLowerCase()}`)
        return
      }
    }
    const pendingTags = parseTagsString(tagInput)
    const allTags = [...new Set([...tags, ...pendingTags])]

    const nextMeta = { ...meta }
    if (type === "card") {
      const last4 = cardLast4(value)
      if (last4) nextMeta.last4 = last4
      else delete nextMeta.last4
    } else {
      delete nextMeta.last4
    }

    setSaving(true)
    try {
      let savedId = item?.id
      const base = {
        title: title.trim(),
        type,
        notes: notes.trim(),
        meta: nextMeta,
        url: url.trim(),
        tags: allTags.join(","),
        color_bg: colorBg,
        color_text: colorText,
      }
      if (isEditing) {
        await window.vaultAPI.update(item.id, { ...base, ...(value ? { value } : {}) })
        toast.success("Credential updated")
      } else {
        const created = await window.vaultAPI.create({ ...base, value: value.trim() })
        savedId = created?.id
        toast.success("Credential saved")
      }
      if (selectedFolderId !== NO_FOLDER && savedId) {
        await window.vaultFolderAPI?.addItem(savedId, selectedFolderId).catch(() => {})
      }
      onSaved?.()
      setOpen(false)
    } catch (err) {
      toast.error(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const selectedType = getVaultType(type)
  const TypeIcon = selectedType.icon
  const typeFields = getVaultTypeFields(type)
  const form = { value, notes, meta }

  const setField = (key, nextValue) => {
    if (key === "value") setValue(nextValue)
    else if (key === "notes") setNotes(nextValue)
    else if (key.startsWith("meta.")) {
      const metaKey = key.slice(5)
      setMeta((prev) => ({ ...prev, [metaKey]: nextValue }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isEditing && !hideTrigger && (
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-5 right-5 h-10 w-10 rounded-full shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all z-50"
            size="icon"
          >
            <IconPlus size={18} />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={cn(
        "sm:max-w-md gap-0 p-0 overflow-hidden",
        "border-border/50 bg-card/95 backdrop-blur-xl",
        "shadow-2xl shadow-black/20",
        "flex flex-col max-h-[85vh]"
      )}>
        <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <TypeIcon size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                {isEditing ? "Edit Credential" : "New Credential"}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isEditing ? "Update your saved credential" : "Securely store an API key, password, or secret"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-1.5">
            <Label htmlFor="vault-title" className="text-[11px] font-medium text-foreground/70">Title</Label>
            <Input
              ref={titleRef}
              id="vault-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OpenAI API Key"
              className="h-8 text-sm border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {vaultFolders.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-foreground/70 flex items-center gap-1.5">
                <IconFolderFilled size={11} />
                Folder
              </Label>
              <FolderSelect
                value={selectedFolderId}
                onChange={setSelectedFolderId}
                folders={vaultFolders}
                onCreate={async (folderName) => {
                  const created = await window.vaultFolderAPI.create({
                    name: folderName,
                    parentId: null,
                  })
                  const list = await window.vaultFolderAPI.list()
                  setVaultFolders(list || [])
                  return created
                }}
                triggerClassName="border-border/60 bg-background/40"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-foreground/70">Type</Label>
            <div className="grid grid-cols-5 gap-1">
              {VAULT_TYPES.map((t) => {
                const Icon = t.icon
                const active = type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (t.id === type) return
                      setType(t.id)
                      setMeta({})
                    }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-[10px] font-medium transition-all cursor-pointer",
                      active
                        ? cn(t.activeColor, "ring-1 ring-current/20 shadow-sm")
                        : cn(t.color, "opacity-50 hover:opacity-80 border-transparent")
                    )}
                  >
                    <Icon size={13} />
                    <span className="leading-none">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fields adapt to the selected credential type */}
          {typeFields.map((field) => {
            const fieldId = `vault-field-${field.key.replace(/\./g, "-")}`
            const fieldValue = readVaultField(form, field.key)
            const optionalHint = isEditing && field.secret && field.key === "value"
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={fieldId} className="text-[11px] font-medium text-foreground/70">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-destructive">*</span>}
                  {optionalHint && (
                    <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                  )}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={fieldId}
                    value={fieldValue}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    className="resize-none text-sm border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
                  />
                ) : field.secret ? (
                  <div className="relative">
                    <Input
                      id={fieldId}
                      type={showValue ? "text" : "password"}
                      value={fieldValue}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={
                        optionalHint ? "Leave blank to keep current" : field.placeholder
                      }
                      className="h-8 pr-8 font-mono text-xs border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowValue(!showValue)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      aria-label={showValue ? "Hide value" : "Show value"}
                    >
                      {showValue ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                    </button>
                  </div>
                ) : (
                  <Input
                    id={fieldId}
                    value={fieldValue}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-8 text-sm border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
                  />
                )}
              </div>
            )
          })}

          <div className="space-y-1.5">
            <Label htmlFor="vault-url" className="text-[11px] font-medium text-foreground/70 flex items-center gap-1.5">
              <IconLink size={11} />
              URL
            </Label>
            <Input
              id="vault-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com (optional)"
              className="h-8 text-sm border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-foreground/70">Tags</Label>
            <Input
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addTag()
                }
                if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                  setTags((prev) => prev.slice(0, -1))
                }
              }}
              placeholder="Type and press enter..."
              className="h-8 text-sm border-border/60 bg-background/40 focus:bg-background focus:border-primary/50 focus:ring-primary/20"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn("gap-1 text-[11px] font-medium border leading-none py-1 px-2", getTagColor(tag))}
                  >
                    {tag}
                    <button
                      type="button"
                      className="cursor-pointer hover:text-destructive leading-none ml-0.5"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    >
                      <IconX size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/70 flex items-center gap-1.5">
                <IconPaperclip size={12} />
                Attachments
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length || !item?.id) return
                  setAttachmentUploading(true)
                  try {
                    for (const file of files) {
                      const reader = new FileReader()
                      const data = await new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result?.split(',')[1] || '')
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                      })
                      await window.vaultAPI?.createAttachment({
                        vaultItemId: item.id,
                        filename: file.name,
                        mimeType: file.type,
                        data,
                      })
                    }
                    const updated = await window.vaultAPI?.listAttachments(item.id)
                    setAttachments(updated || [])
                    toast.success(`${files.length} file(s) attached`)
                  } catch {
                    toast.error("Upload failed")
                  } finally {
                    setAttachmentUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((a) => (
                  <Badge
                    key={a.id}
                    variant="outline"
                    className="gap-1 text-[11px] font-medium border border-border/60 bg-background/40 leading-none py-1 px-2"
                  >
                    <IconFile size={10} className="text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{a.filename}</span>
                    <span className="text-muted-foreground/60 ml-0.5">{formatBytes(a.size)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const att = await window.vaultAPI?.downloadAttachment(a.id)
                          if (!att?.data) return
                          const byteChars = atob(att.data)
                          const arr = new Uint8Array(byteChars.length)
                          for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i)
                          const blob = new Blob([arr], { type: a.mime_type || 'application/octet-stream' })
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = a.filename
                          link.click()
                          URL.revokeObjectURL(url)
                        } catch {
                          toast.error("Download failed")
                        }
                      }}
                      className="cursor-pointer hover:text-primary transition-colors ml-0.5"
                      title="Download"
                    >
                      <IconDownload size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await window.vaultAPI?.deleteAttachment(a.id)
                          setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                          toast.success("Attachment removed")
                        } catch {
                          toast.error("Delete failed")
                        }
                      }}
                      className="cursor-pointer hover:text-destructive transition-colors ml-0.5"
                      title="Remove"
                    >
                      <IconX size={10} />
                    </button>
                  </Badge>
                ))}
                {attachments.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/60 italic">No files attached</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachmentUploading}
                className="h-7 text-[11px] cursor-pointer border-border/60"
              >
                {attachmentUploading ? (
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 animate-spin rounded-full border border-current border-t-transparent" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <IconPlus size={10} />
                    Add file
                  </span>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-foreground/70">Card Tint</Label>
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs transition-all hover:bg-background/60 hover:border-border/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-5 shrink-0 rounded-md border border-black/5"
                      style={{
                        background: colorBg
                          ? `linear-gradient(135deg, ${colorBg} 0%, ${colorBg}cc 100%)`
                          : "linear-gradient(135deg, var(--muted) 0%, var(--accent) 100%)",
                      }}
                    />
                    <span className="text-muted-foreground">
                      {colorBg ? "Custom tint" : "Auto (by type)"}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    {colorBg && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setColorBg("")
                          setColorText("")
                        }}
                        className="cursor-pointer rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        aria-label="Reset to auto"
                      >
                        <IconX size={12} />
                      </button>
                    )}
                    <IconPalette size={14} className="text-muted-foreground/60" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-3" align="start">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-foreground/70">Quick pick</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CARD_TINTS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setColorBg(c.light)
                            setColorText("")
                          }}
                          className={cn(
                            "group relative size-7 cursor-pointer rounded-lg border transition-all hover:scale-110",
                            colorBg === c.light ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "border-black/5"
                          )}
                          style={{ background: `linear-gradient(135deg, ${c.light} 0%, ${c.light}cc 100%)` }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-foreground/70">Custom hex</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorBg || "#6366f1"}
                        onChange={(e) => setColorBg(e.target.value)}
                        className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      />
                      <Input
                        value={colorBg}
                        onChange={(e) => setColorBg(e.target.value)}
                        placeholder="#fef9c3"
                        className="h-7 flex-1 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                  {colorBg && (
                    <div
                      className="flex h-8 items-center justify-center rounded-lg text-[11px] font-medium text-foreground/60"
                      style={{
                        background: `linear-gradient(145deg, ${colorBg} 0%, ${colorBg}cc 100%)`,
                      }}
                    >
                      Preview
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 shrink-0">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 cursor-pointer text-sm font-semibold rounded-lg transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </span>
            ) : isEditing ? "Save Changes" : "Save Credential"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
