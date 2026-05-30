import { useState, useEffect } from "react"
import { toast } from "sonner"
import { IconCopy, IconPlus, IconTrash, IconX } from "@tabler/icons-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const MODELS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
  { value: "claude-3", label: "Claude 3" },
  { value: "gemini", label: "Gemini" },
  { value: "llama", label: "Llama" },
  { value: "mistral", label: "Mistral" },
  { value: "other", label: "Other" },
]

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

function formatTime(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function HomePage() {
  const [prompts, setPrompts] = useState([])
  const [allTags, setAllTags] = useState([])
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [model, setModel] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("qp-prompts")
    if (saved) setPrompts(JSON.parse(saved))
    const tags = localStorage.getItem("qp-tags")
    if (tags) setAllTags(JSON.parse(tags))
  }, [])

  useEffect(() => {
    localStorage.setItem("qp-prompts", JSON.stringify(prompts))
  }, [prompts])

  useEffect(() => {
    localStorage.setItem("qp-tags", JSON.stringify(allTags))
  }, [allTags])

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (!t || selectedTags.includes(t)) return
    setSelectedTags([...selectedTags, t])
    if (!allTags.includes(t)) setAllTags([...allTags, t])
    setTagInput("")
  }

  function removeTag(tag) {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  function savePrompt() {
    if (!content.trim()) {
      toast.error("Please enter a prompt")
      return
    }
    const prompt = {
      id: Date.now().toString(),
      content: content.trim(),
      model: model || "none",
      tags: selectedTags,
      createdAt: new Date().toISOString(),
    }
    setPrompts([prompt, ...prompts])
    setContent("")
    setModel("")
    setSelectedTags([])
    setTagInput("")
    setOpen(false)
    toast.success("Prompt saved!")
  }

  function copyPrompt(content) {
    navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard!")
  }

  function deletePrompt(id) {
    setPrompts(prompts.filter((p) => p.id !== id))
    toast.success("Prompt deleted")
  }

  const filteredPrompts = prompts.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.model.includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold text-foreground">QuickPrompt</h1>
          <p className="text-sm text-muted-foreground">Create, tag, and copy prompts instantly</p>
        </div>
        <Input
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">No prompts yet</p>
            <p className="text-sm mt-1">Click the + button to add your first prompt</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => copyPrompt(prompt.content)}
                className="group relative bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1">
                    {prompt.content}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); copyPrompt(prompt.content) }}
                    >
                      <IconCopy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deletePrompt(prompt.id) }}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {prompt.model !== "none" && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {MODELS.find((m) => m.value === prompt.model)?.label || prompt.model}
                    </Badge>
                  )}
                  {prompt.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn("text-xs font-normal border", getTagColor(tag))}
                    >
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatTime(prompt.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg cursor-pointer"
            size="icon"
          >
            <IconPlus size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Prompt</Label>
              <Textarea
                id="content"
                placeholder="Write your prompt here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model" className="cursor-pointer">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="cursor-pointer">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  className="flex-1"
                  list="tag-suggestions"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tagInput)}
                  className="cursor-pointer"
                >
                  Add
                </Button>
              </div>
              <datalist id="tag-suggestions">
                {allTags
                  .filter((t) => !selectedTags.includes(t))
                  .map((t) => (
                    <option key={t} value={t} />
                  ))}
              </datalist>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn("text-xs font-normal gap-1 border", getTagColor(tag))}
                    >
                      {tag}
                      <IconX
                        size={12}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={savePrompt} className="w-full cursor-pointer">
              Save Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
