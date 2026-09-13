import { cn } from "@/lib/utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { getVaultType } from "@/components/vault-item-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconCheck,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFolderMinus,
  IconFolderPlus,
  IconLink,
  IconPaperclip,
  IconPin,
  IconPinFilled,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react"

export function maskValue(value, type) {
  const raw = value || ""
  if (!raw) return "Empty"
  if (type === "password" || type === "card") return "••••••••••••"
  if (raw.length <= 8) return "•".repeat(raw.length)
  return `${raw.slice(0, 4)}${"•".repeat(8)}${raw.slice(-4)}`
}

function TypeBadge({ type }) {
  const Icon = type.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-medium leading-tight",
        type.color
      )}
    >
      <Icon size={9} />
      {type.label}
    </span>
  )
}

function ValueRow({ item, type, revealed, value, onToggleReveal }) {
  const Icon = type.icon
  return (
    <div className="flex min-h-[30px] items-center gap-2 rounded-lg bg-foreground/5 px-2 py-1.5">
      <Icon size={13} className="shrink-0 text-foreground/50" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-mono text-xs",
          revealed ? "text-foreground" : "text-foreground/70"
        )}
      >
        {revealed ? value || "—" : maskValue(item.hasValue ? "secret" : "", item.type)}
      </span>
      <button
        onClick={onToggleReveal}
        className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
        aria-label={revealed ? "Hide value" : "Reveal value"}
      >
        {revealed ? <IconEyeOff size={13} /> : <IconEye size={13} />}
      </button>
    </div>
  )
}

function TagChips({ tags, max = 3 }) {
  const list = parseTagsString(tags)
  if (list.length === 0) return null
  const visible = list.slice(0, max)
  const hidden = list.length - visible.length
  return (
    <>
      {visible.map((tag) => (
        <span key={tag} className={cn(TAG_CLASS, getTagColor(tag))}>
          {tag}
        </span>
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center rounded-full border border-border/60 bg-foreground/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70">
          +{hidden}
        </span>
      )}
    </>
  )
}

function MetaRow({ item, attachmentCount }) {
  const hasUrl = Boolean(item.url)
  const hasNotes = Boolean(item.notes)
  const tagCount = parseTagsString(item.tags).length
  if (!hasUrl && !hasNotes && tagCount === 0 && !attachmentCount) return null
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {hasUrl && (
        <a
          href={item.url}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.shellAPI?.openExternal(item.url)
          }}
          className="flex min-w-0 max-w-[60%] flex-1 items-center gap-1 text-[11px] text-primary/80 transition-colors hover:text-primary"
          title={item.url}
        >
          <IconLink size={10} className="shrink-0" />
          <span className="truncate">{item.url.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
      {hasNotes && (
        <p className="line-clamp-1 min-w-0 max-w-[60%] flex-1 text-[11px] text-foreground/60">
          {item.notes}
        </p>
      )}
      <TagChips tags={item.tags} />
      {attachmentCount > 0 && (
        <span className="flex items-center gap-1 text-[10px] text-foreground/50">
          <IconPaperclip size={10} />
          {attachmentCount}
        </span>
      )}
    </div>
  )
}

function CopyButton({ copied, onCopy, subtle = false }) {
  return (
    <button
      onClick={onCopy}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        copied
          ? "bg-primary/10 text-primary"
          : subtle
            ? "text-foreground/50 hover:bg-foreground/10 hover:text-foreground/80"
            : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
      )}
    >
      {copied ? <IconCheck className="size-3" /> : <IconCopy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function CardMenu({ item, inFolder, onEdit, onTogglePin, onMove, onRemoveFromFolder, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
          aria-label="More options"
        >
          <IconDotsVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <IconEdit className="size-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePin}>
          {item.pinned ? <IconPinFilled className="size-3.5" /> : <IconPin className="size-3.5" />}
          {item.pinned ? "Unpin" : "Pin to top"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <IconFolderPlus className="size-3.5" /> Move to folder
        </DropdownMenuItem>
        {inFolder && (
          <DropdownMenuItem onClick={onRemoveFromFolder}>
            <IconFolderMinus className="size-3.5" /> Remove from folder
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <IconTrash className="size-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A vault credential / secret. Handles both the compact mini-window layout
 * (sticky note) and the wider card layout.
 */
export function VaultItemCard({
  item,
  mini = false,
  revealed = false,
  value = "",
  copied = false,
  attachmentCount = 0,
  tint,
  inlineStyle = {},
  dragHandle,
  inFolder = false,
  onCopy,
  onToggleReveal,
  onToggleFavorite,
  onTogglePin,
  onDelete,
  onEdit,
  onMove,
  onRemoveFromFolder,
}) {
  const type = getVaultType(item.type)
  const TypeIcon = type.icon
  const hasCustomColor = Boolean(item.color_bg)

  const favoriteButton = (
    <button
      onClick={onToggleFavorite}
      className="shrink-0 cursor-pointer transition-all hover:scale-110"
      aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
    >
      {item.favorite ? (
        <IconStarFilled size={14} className="text-amber-500 drop-shadow-sm" />
      ) : (
        <IconStar size={14} className="text-foreground/30 transition-colors hover:text-amber-500" />
      )}
    </button>
  )

  const menu = (
    <CardMenu
      item={item}
      inFolder={inFolder}
      onEdit={() => onEdit(item)}
      onTogglePin={() => onTogglePin(item.id)}
      onMove={() => onMove(item.id)}
      onRemoveFromFolder={() => onRemoveFromFolder(item.id)}
      onDelete={() => onDelete(item.id)}
    />
  )

  if (mini) {
    return (
      <div
        className={cn(
          "group flex flex-col rounded-xl transition-all",
          hasCustomColor ? "sticky-note" : `sticky-note ${tint}`,
          copied && "ring-1 ring-primary/40"
        )}
        style={inlineStyle}
      >
        <div className="flex flex-1 flex-col gap-2 p-3.5 pb-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-1.5">
              {dragHandle && (
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  {dragHandle}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-1 text-[13px] font-semibold leading-snug">
                  {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
                  <span className="truncate">{item.title}</span>
                </h3>
                <div className="mt-1">
                  <TypeBadge type={type} />
                </div>
              </div>
            </div>
            {favoriteButton}
          </div>

          <ValueRow
            item={item}
            type={type}
            revealed={revealed}
            value={value}
            onToggleReveal={onToggleReveal}
          />

          <MetaRow item={item} attachmentCount={attachmentCount} />
        </div>

        <div className="mt-auto flex items-center justify-between px-3.5 py-2">
          <CopyButton copied={copied} onCopy={onCopy} subtle />
          {menu}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl transition-all",
        hasCustomColor ? "sticky-note" : "border border-border bg-card hover:ring-1 hover:ring-primary/30",
        copied && "ring-1 ring-primary/40"
      )}
      style={inlineStyle}
    >
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {dragHandle && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
            {dragHandle}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", type.color)}>
              <TypeIcon size={14} />
            </div>
            <div className="min-w-0">
              <h3 className="flex items-center gap-1 text-[13px] font-semibold leading-snug">
                {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
                <span className="truncate">{item.title}</span>
              </h3>
              <div className="mt-1">
                <TypeBadge type={type} />
              </div>
            </div>
          </div>
          {favoriteButton}
        </div>

        <ValueRow
          item={item}
          type={type}
          revealed={revealed}
          value={value}
          onToggleReveal={onToggleReveal}
        />

        <MetaRow item={item} attachmentCount={attachmentCount} />

        <div className="mt-auto flex items-center justify-between">
          <CopyButton copied={copied} onCopy={onCopy} />
          {menu}
        </div>
      </div>
    </div>
  )
}

export default VaultItemCard
