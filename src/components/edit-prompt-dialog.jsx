import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { IconX, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TagManager } from "@/components/tag-manager"
import { useCardDisplaySettings } from "@/hooks/useCardDisplaySettings"
import { cn } from "@/lib/utils"
import { splitTagInput, parseTagsString } from "@/lib/tag-utils"

const TAG_COLORS = [
  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "bg-green-500/10 text-green-500 border-green-500/20",
  "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "bg-teal-500/10 text-teal-500 border-teal-500/20",
  "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "bg-rose-500/10 text-rose-500 border-rose-500/20",
]

function getTagColor(tag) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function EditPromptDialog({ prompt, onSaved, allTags: externalTags, mini, open: externalOpen, onOpenChange: externalOnOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [allTags, setAllTags] = useState(externalTags || [])
  const [cardDisplay] = useCardDisplaySettings()
  const inputRef = useRef(null)
  const titleRef = useRef(null)
  const showTagInput = cardDisplay?.showTagInput ?? true

  useEffect(() => {
    if (open && prompt) {
      setTitle(typeof prompt.title === "string" ? prompt.title : "")
      setContent(prompt.content || "")
      setSelectedTags(prompt.tags ? [...prompt.tags] : [])
      setAllTags(externalTags || [])
    }
  }, [open, prompt, externalTags])

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100)
  }, [open])

  function addTag() {
    const input = inputRef.current
    if (!input) return
    const t = input.value.trim().toLowerCase()
    if (!t) return
    input.value = ""
    setTagInput("")
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((tag) => tag !== t))
      input.focus()
      return
    }
    setSelectedTags([...selectedTags, t])
    if (!allTags.includes(t)) {
      window.db.createTag(t).then(() => {
        setAllTags((prev) => [...prev, t])
      }).catch((err) => {
        console.error("Failed to create tag:", err)
      })
    }
    input.focus()
  }

  function commitTagsFromInput(completeTags) {
    const fresh = completeTags.filter((t) => t && !selectedTags.includes(t))
    if (fresh.length === 0) return
    setSelectedTags((prev) => [...prev, ...fresh])
    setAllTags((prev) => {
      const next = [...prev]
      for (const t of fresh) {
        if (!next.includes(t)) next.push(t)
      }
      return next
    })
    for (const t of fresh) {
      if (!allTags.includes(t)) {
        window.db.createTag(t).catch((err) => {
          console.error("Failed to create tag:", err)
        })
      }
    }
  }

  function handleTagInputChange(e) {
    const value = e.target.value
    const { completeTags, remaining } = splitTagInput(value)
    if (completeTags.length > 0) {
      commitTagsFromInput(completeTags)
      setTagInput(remaining)
      if (inputRef.current) inputRef.current.value = remaining
      return
    }
    setTagInput(value)
  }

  function removeTag(tag) {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  async function saveEdit() {
    if (!content.trim()) {
      toast.error("Please enter a prompt")
      return
    }
    const pendingRaw = (inputRef.current?.value ?? tagInput).trim()
    const pendingTags = parseTagsString(pendingRaw)
    const fresh = pendingTags.filter((t) => !selectedTags.includes(t))
    const tagsToSave = [...selectedTags, ...fresh]
    try {
      await window.db.updatePrompt(prompt.id, {
        title: title.trim(),
        content: content.trim(),
        tags: tagsToSave.join(","),
      })
      for (const newTag of fresh) {
        if (!allTags.includes(newTag)) {
          window.db.createTag(newTag).catch((err) => {
            console.error("Failed to create tag:", err)
          })
        }
      }
      setAllTags((prev) => {
        const next = [...prev]
        for (const t of fresh) {
          if (!next.includes(t)) next.push(t)
        }
        return next
      })
      onSaved?.()
      setTagInput("")
      if (inputRef.current) inputRef.current.value = ""
      setOpen(false)
      toast.success("Prompt updated!")
    } catch (err) {
      toast.error(err?.message || String(err))
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mini ? (
        <DialogContent className="sm:max-w-sm gap-3 sticky-dialog">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              ref={titleRef}
              id="title"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm font-medium border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background"
            />
            <Textarea
              id="content"
              placeholder="Write your prompt here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none text-sm border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background max-h-48 overflow-y-auto"
            />
            {showTagInput && (
              <div className="space-y-2">
                <Input
                  ref={inputRef}
                  placeholder="Add tag — space, comma, or enter"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="h-8 text-xs placeholder:text-xs border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background"
                />
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn("text-[11px] font-medium gap-1 border leading-none px-2 py-0.5", getTagColor(tag))}
                      >
                        {tag}
                        <span
                          className="cursor-pointer hover:text-destructive leading-none ml-0.5"
                          onClick={() => removeTag(tag)}
                        >
                          <IconX size={10} />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button onClick={saveEdit} className="w-full cursor-pointer h-9 text-sm font-medium">
              Update
            </Button>
          </div>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                ref={titleRef}
                id="title"
                placeholder="A short name for this prompt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Prompt</Label>
              <Textarea
                id="content"
                placeholder="Write your prompt here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none max-h-60 overflow-y-auto"
              />
            </div>
            {showTagInput && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type a tag — space, comma, or enter"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    className="flex-1 text-xs placeholder:text-xs"
                  />
                  <TagManager
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    allTags={allTags}
                  />
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn("text-xs font-normal gap-1 border", getTagColor(tag))}
                      >
                        <IconCheck size={10} />
                        {tag}
                        <span
                          className="cursor-pointer hover:text-destructive"
                          onClick={() => removeTag(tag)}
                        >
                          <IconX size={12} />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button onClick={saveEdit} className="w-full cursor-pointer">
              Update Prompt
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
