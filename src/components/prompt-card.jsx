import { useState } from "react"
import { IconCopy, IconTrash, IconDotsVertical, IconStar, IconStarFilled, IconEdit, IconArrowMoveRight } from "@tabler/icons-react"
import { FolderGlyph } from "@/components/folders/FolderGlyph"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { EditPromptDialog } from "@/components/edit-prompt-dialog"
import { PromptDetailDialog } from "@/components/prompt-detail-dialog"
import { cn } from "@/lib/utils"
import { getPromptTitle, getPromptBody } from "@/lib/prompt-utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { getStickyTint } from "@/lib/sticky-tint"
import { DENSITY_CLASSES, LINE_CLAMP_MAP } from "@/hooks/useCardDisplaySettings"

const MORE_CLASS = "inline-flex items-center rounded-full border border-border/60 bg-muted px-1.5 py-[1px] text-[10px] font-medium text-muted-foreground leading-tight cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"

function TagList({ tags, max = 3, wrap = true }) {
  const list = parseTagsString(tags)
  if (!list || list.length === 0) return null
  const visible = list.slice(0, max)
  const hidden = list.slice(max)
  return (
    <div className={cn("flex items-center gap-1", wrap ? "flex-wrap" : "flex-nowrap")}>
      {visible.map((tag) => (
        <span key={tag} className={`${TAG_CLASS} ${getTagColor(tag)}`}>
          {tag}
        </span>
      ))}
      {hidden.length > 0 && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <span className={MORE_CLASS}>+{hidden.length}</span>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Show {hidden.length} more tag{hidden.length === 1 ? "" : "s"}</TooltipContent>
          </Tooltip>
          <PopoverContent side="bottom" align="start" className="w-auto max-w-[260px] p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {hidden.length} more tag{hidden.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-1">
              {hidden.map((tag) => (
                <span key={tag} className={`${TAG_CLASS} ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
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

export function PromptCardItem({ prompt, onCopy, onDelete, onToggleFavorite, viewMode = "grid", allTags = [], mini = false, onSaved, autoCopy = true, display, dragHandle, folderName, folderColor, folderIcon, onMoveToFolder }) {
  const showTags = display?.showTags ?? true
  const showTitle = display?.showTitle ?? true
  const showBody = display?.showBody ?? true
  const showStar = display?.showStar ?? true
  const showCopyButton = display?.showCopyButton ?? true
  const showTimestamp = display?.showTimestamp ?? true
  const cardDensity = display?.cardDensity ?? "normal"
  const colorByTag = display?.colorByTag ?? false
  const maxLines = display?.maxLines ?? 3
  const densityClasses = DENSITY_CLASSES[cardDensity] || DENSITY_CLASSES.normal
  const bodyClamp = maxLines === 0 ? "" : LINE_CLAMP_MAP[maxLines] || `line-clamp-${maxLines}`
  const tintTag = colorByTag && prompt.tags.length > 0 ? prompt.tags[0] : null
  const [copied, setCopied] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [clicked, setClicked] = useState(false)

  const title = getPromptTitle(prompt)
  const bodyText = getPromptBody(prompt)
  const hasBody = bodyText.length > 0

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

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    setDetailOpen(true)
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

  const tagBadges = prompt.tags.length > 0 ? <TagList tags={prompt.tags} max={3} /> : null

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
          {onMoveToFolder && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToFolder(prompt.id) }}>
              <IconArrowMoveRight className="size-3.5" /> Move to folder
            </DropdownMenuItem>
          )}
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

  return (
    <>
    {viewMode === "list" ? (
    <div
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-all hover:bg-accent/50 hover:ring-1 hover:ring-primary/20",
        clicked && "scale-[0.98] ring-2 ring-primary/40"
      )}
    >
      {dragHandle && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {dragHandle}
        </div>
      )}
      {showStar && (
        <button onClick={handleFavorite} className="shrink-0 cursor-pointer">
          {prompt.favorite ? (
            <IconStarFilled size={16} className="text-chart-3" />
          ) : (
            <IconStar size={16} className="text-muted-foreground hover:text-chart-3" />
          )}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm">
          {showTitle && <span className="font-semibold text-foreground">{title}</span>}
          {showBody && hasBody && showTitle && <span className="text-muted-foreground"> — {bodyText}</span>}
          {showBody && hasBody && !showTitle && <span className="text-foreground">{bodyText}</span>}
        </p>
      </div>
      {showTags && tagBadges && (
        <div className="shrink-0">
          <TagList tags={prompt.tags} max={2} wrap={false} />
        </div>
      )}
      {showTimestamp && (
        <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">{formatTime(prompt.created_at)}</span>
      )}
      {showCopyButton && copyBtn}
      {menuBtn}
    </div>
  ) : (
    <div
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl transition-all",
        mini
          ? `sticky-note ${getStickyTint(tintTag || prompt.content)}`
          : colorByTag
            ? `border border-border/60 ${getStickyTint(tintTag || prompt.content)} hover:ring-1 hover:ring-primary/30`
            : "border border-border bg-card hover:ring-1 hover:ring-primary/30",
        clicked && "scale-[0.98] ring-2 ring-primary/40"
      )}
    >
      {/* Compact layout (mini window) - Sticky Note Style */}
      {mini && (
        <div className={cn("flex flex-col pb-1", densityClasses.card, densityClasses.gap)}>
          <div className="flex items-start justify-between gap-2">
            {dragHandle && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {dragHandle}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {showTitle && (
                <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground leading-snug">
                  {title}
                </h3>
              )}
              {showBody && (
                <p className={cn("mt-1 text-[12px] text-foreground/70 leading-relaxed font-normal", bodyClamp)}>
                  {bodyText}
                </p>
              )}
            </div>
            {showStar && (
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
            )}
          </div>
          {showTags && prompt.tags.length > 0 && (
            <TagList tags={prompt.tags} max={6} />
          )}
        </div>
      )}
      {mini && (
        <div className={cn("flex items-center justify-between mt-auto", densityClasses.footer)}>
          <div className="flex items-center gap-1.5 min-w-0">
            {showTimestamp ? (
              <span className="text-[10px] text-foreground/40 font-medium">
                {formatTime(prompt.created_at)}
              </span>
            ) : null}
            {folderName && (
              <span className="flex items-center gap-0.5 text-[9px] text-foreground/40 truncate">
                <FolderGlyph folder={{ icon: folderIcon, color: folderColor }} size={9} />
                {folderName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] text-foreground/50 font-medium transition-colors hover:bg-foreground/10 hover:text-foreground/80"
              >
                <IconCopy className="size-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
            {menuBtn}
          </div>
        </div>
      )}

      {/* Full layout (large window) */}
      {!mini && (
        <div className={cn("flex flex-col pb-1", densityClasses.card, densityClasses.gap)}>
          <div className="flex items-start justify-between gap-2">
            {dragHandle && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {dragHandle}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {showTitle && (
                <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground leading-snug">
                  {title}
                </h3>
              )}
              {showBody && hasBody && (
                <p className={cn("mt-1 text-[12px] text-foreground/70 leading-relaxed font-normal", bodyClamp)}>
                  {bodyText}
                </p>
              )}
            </div>
            {showStar && starBtn}
          </div>
          {showTags && tagBadges}
        </div>
      )}
      {!mini && (
        <div className={cn("flex items-center justify-between mt-auto", densityClasses.footer)}>
          <div className="flex items-center gap-1.5 min-w-0">
            {showTimestamp ? (
              <span className="text-[10px] text-muted-foreground font-medium">
                {formatTime(prompt.created_at)}
              </span>
            ) : null}
            {folderName && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70 truncate">
                <FolderGlyph folder={{ icon: folderIcon, color: folderColor }} size={9} />
                {folderName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {showCopyButton && copyBtn}
            {menuBtn}
          </div>
        </div>
      )}
    </div>
  )}
  <PromptDetailDialog
    prompt={prompt}
    open={detailOpen}
    onOpenChange={setDetailOpen}
  />
  </>
  )
}

export function parsePrompt(p) {
  return {
    ...p,
    title: typeof p?.title === "string" ? p.title : "",
    tags: parseTagsString(p.tags),
  }
}
