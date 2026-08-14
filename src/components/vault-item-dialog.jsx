import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { IconLock, IconKey, IconShieldLock, IconNote, IconCreditCard, IconEye, IconEyeOff, IconPlus, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { parseTagsString, splitTagInput } from "@/lib/tag-utils"

export const VAULT_TYPES = [
  { id: "api_key", label: "API Key", icon: IconKey, color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
  { id: "password", label: "Password", icon: IconLock, color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" },
  { id: "token", label: "Token", icon: IconShieldLock, color: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400" },
  { id: "card", label: "Card", icon: IconCreditCard, color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
  { id: "note", label: "Note", icon: IconNote, color: "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400" },
]

export function getVaultType(id) {
  return VAULT_TYPES.find((t) => t.id === id) || VAULT_TYPES[VAULT_TYPES.length - 1]
}

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

function getTagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function VaultItemDialog({ open, onOpenChange, onSaved, item = null, mini = false, hideTrigger = false }) {
  const isEditing = Boolean(item)
  const controlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlled ? open : internalOpen
  const [title, setTitle] = useState("")
  const [type, setType] = useState("api_key")
  const [value, setValue] = useState("")
  const [notes, setNotes] = useState("")
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState("")
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

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
      setTags(Array.isArray(item?.tags) ? item.tags : [])
      setTagInput("")
      setShowValue(false)
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
    if (!isEditing && !value.trim()) {
      toast.error("Please enter a value")
      return
    }
    const pendingTags = parseTagsString(tagInput)
    const allTags = [...new Set([...tags, ...pendingTags])]
    setSaving(true)
    try {
      if (isEditing) {
        await window.vaultAPI.update(item.id, {
          title: title.trim(),
          type,
          notes: notes.trim(),
          tags: allTags.join(","),
          ...(value ? { value } : {}),
        })
        toast.success("Credential updated")
      } else {
        await window.vaultAPI.create({
          title: title.trim(),
          type,
          value: value.trim(),
          notes: notes.trim(),
          tags: allTags.join(","),
        })
        toast.success("Credential saved")
      }
      onSaved?.()
      setOpen(false)
    } catch (err) {
      toast.error(err?.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const valueInput = (
    <div className="relative">
      <Input
        type={showValue ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isEditing ? "Leave blank to keep current value" : "Paste the secret value here…"}
        className="pr-9 font-mono text-xs border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background"
      />
      <button
        type="button"
        onClick={() => setShowValue(!showValue)}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
        aria-label={showValue ? "Hide value" : "Show value"}
      >
        {showValue ? <IconEyeOff size={14} /> : <IconEye size={14} />}
      </button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isEditing && !hideTrigger && (
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
            size="icon"
          >
            <IconPlus size={20} />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={mini ? "sm:max-w-sm gap-3 sticky-dialog" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className={mini ? "text-sm font-semibold" : undefined}>
            {isEditing ? "Edit Credential" : "Add Credential"}
          </DialogTitle>
        </DialogHeader>
        <div className={mini ? "space-y-3" : "space-y-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="vault-title" className={mini && "text-xs"}>Title</Label>
            <Input
              ref={titleRef}
              id="vault-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OpenAI API Key"
              className={cn(
                "h-8 border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background",
                mini ? "text-xs placeholder:text-xs" : "text-sm placeholder:text-sm"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={mini && "text-xs"}>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAULT_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5">
              {VAULT_TYPES.map((t) => {
                const Icon = t.icon
                const active = type === t.id
                return (
                  <Badge
                    key={t.id}
                    variant="outline"
                    onClick={() => setType(t.id)}
                    className={cn(
                      "cursor-pointer gap-1 text-[11px] font-medium transition-colors",
                      t.color,
                      active ? "ring-1 ring-current opacity-100" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <Icon size={11} /> {t.label}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vault-value" className={mini && "text-xs"}>{isEditing ? "Value (optional)" : "Value"}</Label>
            {valueInput}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vault-notes" className={mini && "text-xs"}>Notes</Label>
            <Textarea
              id="vault-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reminder, username, URL…"
              rows={mini ? 2 : 3}
              className={cn(
                "resize-none border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background",
                mini && "text-xs placeholder:text-xs"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={mini && "text-xs"}>Tags</Label>
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
              placeholder="Type a tag — space, comma, or enter"
              className="h-8 text-xs placeholder:text-xs border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn("cursor-default gap-1 text-[11px] font-medium border leading-none", getTagColor(tag))}
                  >
                    {tag}
                    <span
                      className="cursor-pointer hover:text-destructive leading-none ml-0.5"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    >
                      <IconX size={10} />
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn("w-full cursor-pointer", mini && "h-8 text-xs font-medium")}
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Save Credential"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}