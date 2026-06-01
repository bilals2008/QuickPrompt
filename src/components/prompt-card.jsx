import { useState } from "react"
import { IconCopy, IconTrash, IconDotsVertical, IconStar, IconStarFilled, IconEdit } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditPromptDialog } from "@/components/edit-prompt-dialog"
import { cn } from "@/lib/utils"

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

function getStickyTint(content) {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    hash = content.charCodeAt(i) + ((hash << 5) - hash)
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

const TAG_CLASS = "inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-medium border leading-tight"

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

export function PromptCardItem({ prompt, onCopy, onDelete, onToggleFavorite, viewMode = "grid", allTags = [], mini = false, onSaved, autoCopy = true }) {
  const [copied, setCopied] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [clicked, setClicked] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    onCopy(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleCardClick = () => {
    if (autoCopy) {
      onCopy(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    setClicked(true)
    setTimeout(() => setClicked(false), 200)
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite(prompt.id)
  }

  const starBtn = (
    <button
      onClick={handleFavorite}
      className="shrink-0 cursor-pointer transition-colors hover:text-amber-400"
    >
      {prompt.favorite ? (
        <IconStarFilled size={14} className="text-amber-400" />
      ) : (
        <IconStar size={14} />
      )}
    </button>
  )

  const tagBadges = prompt.tags.length > 0 ? (
    prompt.tags.map((tag) => (
      <span key={tag} className={`${TAG_CLASS} ${getTagColor(tag)}`}>
        {tag}
      </span>
    ))
  ) : null

  const copyBtn = (
    <button
      onClick={handleCopy}
      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <IconCopy className="size-3" />
      {copied ? "Copied!" : "Copy"}
    </button>
  )

  const menuBtn = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <IconDotsVertical className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(prompt.content) }}>
            <IconCopy className="size-3.5" /> Copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}>
            <IconEdit className="size-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(prompt.id) }}>
            <IconTrash className="size-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditPromptDialog
        prompt={{ ...prompt, tags: prompt.tags || [] }}
        onSaved={onSaved}
        allTags={allTags}
        mini={mini}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )

  return viewMode === "list" ? (
    <div
      onClick={handleCardClick}
      className={cn(
        "group flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-all hover:bg-accent/50 hover:ring-1 hover:ring-primary/20",
        clicked && "scale-[0.98] ring-2 ring-primary/40"
      )}
    >
      <button onClick={handleFavorite} className="shrink-0 cursor-pointer">
        {prompt.favorite ? (
          <IconStarFilled size={16} className="text-chart-3" />
        ) : (
          <IconStar size={16} className="text-muted-foreground hover:text-chart-3" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{prompt.content}</span>
        </p>
      </div>
      {tagBadges && (
        <div className="items-center gap-1.5 shrink-0 flex">
          {prompt.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={`${TAG_CLASS} ${getTagColor(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">{formatTime(prompt.created_at)}</span>
      {copyBtn}
      {menuBtn}
    </div>
  ) : (
    <div
      onClick={handleCardClick}
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl transition-all",
        mini
          ? `sticky-note ${getStickyTint(prompt.content)}`
          : "border border-border bg-card hover:ring-1 hover:ring-primary/30",
        clicked && "scale-[0.98] ring-2 ring-primary/40"
      )}
    >
      {/* Compact layout (mini window) - Sticky Note Style */}
      {mini && (
        <div className="flex flex-col gap-2 p-3.5 pb-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-3 text-[13px] text-foreground/80 leading-relaxed font-medium">
              {prompt.content}
            </p>
            <button
              onClick={handleFavorite}
              className="shrink-0 cursor-pointer transition-colors hover:scale-110"
            >
              {prompt.favorite ? (
                <IconStarFilled size={14} className="text-amber-500 drop-shadow-sm" />
              ) : (
                <IconStar size={14} className="text-foreground/30 hover:text-amber-500" />
              )}
            </button>
          </div>
          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className={`${TAG_CLASS} ${getTagColor(tag)} bg-background/40 backdrop-blur-sm`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {mini && (
        <div className="flex items-center justify-between px-3.5 py-1.5 mt-auto">
          <span className="text-[10px] text-foreground/40 font-medium">
            {formatTime(prompt.created_at)}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleCopy}
              className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] text-foreground/50 font-medium transition-colors hover:bg-foreground/10 hover:text-foreground/80"
            >
              <IconCopy className="size-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
            {menuBtn}
          </div>
        </div>
      )}

      {/* Full layout (large window) */}
      {!mini && (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                {prompt.content}
              </p>
              {starBtn}
            </div>
            {tagBadges && (
              <div className="flex flex-wrap gap-1">
                {tagBadges}
              </div>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border/60 px-4 py-2">
            <span className="text-[11px] text-muted-foreground">
              {formatTime(prompt.created_at)}
            </span>
            <div className="flex items-center gap-1">
              {copyBtn}
              {menuBtn}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function parsePrompt(p) {
  return {
    ...p,
    tags: p.tags ? p.tags.split(",").filter(Boolean) : [],
  }
}
