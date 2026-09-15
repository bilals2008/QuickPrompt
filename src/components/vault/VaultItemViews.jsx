import { cn } from "@/lib/utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { getVaultType } from "@/components/vault-item-dialog"
import { maskValue } from "@/lib/vault-types"
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

/* ───── Shared helpers ───── */

function TypeIcon({ type, size = 14 }) {
  const Icon = type.icon
  return <Icon size={size} />
}

function maskedPreview(item) {
  if (item?.type === "card" && item.meta?.last4) {
    return `•••• •••• •••• ${item.meta.last4}`
  }
  return maskValue(item.hasValue ? "secret" : "", item.type)
}

function canCopyItem(item) {
  return item.type === "note" ? Boolean(item.notes) : true
}

function FavoriteBtn({ item, onToggleFavorite, size = 13 }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggleFavorite(item.id)
      }}
      className="shrink-0 cursor-pointer transition-all hover:scale-110"
      aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
    >
      {item.favorite ? (
        <IconStarFilled size={size} className="text-amber-500 drop-shadow-sm" />
      ) : (
        <IconStar size={size} className="text-foreground/30 transition-colors hover:text-amber-500" />
      )}
    </button>
  )
}

function ItemMenu({
  item,
  inFolder,
  onEdit,
  onTogglePin,
  onMove,
  onRemoveFromFolder,
  onDelete,
  onToggleFavorite,
  onToggleReveal,
  revealed,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
          aria-label="More options"
        >
          <IconDotsVertical className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onToggleFavorite && (
          <DropdownMenuItem onClick={() => onToggleFavorite(item.id)}>
            {item.favorite ? (
              <IconStarFilled className="size-3.5" />
            ) : (
              <IconStar className="size-3.5" />
            )}
            {item.favorite ? "Remove favorite" : "Add favorite"}
          </DropdownMenuItem>
        )}
        {onToggleReveal && item.type !== "note" && (
          <DropdownMenuItem onClick={() => onToggleReveal(item)}>
            {revealed ? <IconEyeOff className="size-3.5" /> : <IconEye className="size-3.5" />}
            {revealed ? "Hide value" : "Reveal value"}
          </DropdownMenuItem>
        )}
        {(onToggleFavorite || onToggleReveal) && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <IconEdit className="size-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTogglePin(item.id)}>
          {item.pinned ? <IconPinFilled className="size-3.5" /> : <IconPin className="size-3.5" />}
          {item.pinned ? "Unpin" : "Pin to top"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(item.id)}>
          <IconFolderPlus className="size-3.5" /> Move to folder
        </DropdownMenuItem>
        {inFolder && (
          <DropdownMenuItem onClick={() => onRemoveFromFolder(item.id)}>
            <IconFolderMinus className="size-3.5" /> Remove from folder
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(item.id)}>
          <IconTrash className="size-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CopyBtn({ copied, onCopy, subtle = false, block = false }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCopy()
      }}
      className={cn(
        "flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        block && "w-full py-1.5",
        copied
          ? "bg-primary/10 text-primary"
          : subtle
            ? "bg-foreground/8 text-foreground/60 hover:bg-primary/10 hover:text-primary"
            : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
      )}
    >
      {copied ? <IconCheck className="size-3" /> : <IconCopy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
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
        <span className="inline-flex items-center rounded-full bg-foreground/10 px-1.5 py-[1px] text-[10px] font-medium leading-tight text-foreground/70">
          +{hidden}
        </span>
      )}
    </>
  )
}

function getMetaText(item) {
  const meta = item.meta || {}
  const parts = []
  if (item.type === "password" && meta.username) parts.push(meta.username)
  if (item.type === "api_key" && meta.keyId) parts.push(meta.keyId)
  if (item.type === "token" && meta.expires) parts.push(`Exp ${meta.expires}`)
  if (item.type === "card") {
    if (meta.holder) parts.push(meta.holder)
    if (meta.expiry) parts.push(`Exp ${meta.expiry}`)
  }
  return parts.join(" · ")
}

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ValueRow({ item, type, revealed, value, onToggleReveal, large = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-foreground/5 px-2",
        large ? "min-h-[38px] py-2" : "min-h-[30px] py-1.5"
      )}
    >
      <TypeIcon type={type} size={13} />
      <span
        className={cn(
          "min-w-0 flex-1 font-mono",
          large ? "break-all text-[13px]" : "truncate text-xs",
          revealed ? "text-foreground" : "text-foreground/70"
        )}
      >
        {revealed ? value || "—" : maskedPreview(item)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleReveal(item)
        }}
        className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
        aria-label={revealed ? "Hide" : "Reveal"}
      >
        {revealed ? <IconEyeOff size={13} /> : <IconEye size={13} />}
      </button>
    </div>
  )
}

function UrlLink({ url }) {
  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        window.shellAPI?.openExternal(url)
      }}
      className="flex min-w-0 items-center gap-1 text-[11px] text-primary/80 transition-colors hover:text-primary"
      title={url}
    >
      <IconLink size={10} className="shrink-0" />
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
    </a>
  )
}

function makeItemActions(item, actions) {
  return {
    copy: () => {
      if (canCopyItem(item)) actions.onCopy(item)
    },
    edit: () => actions.onEdit(item),
  }
}

/* ───── VIEW: Cards (two columns) ───── */

export function VaultGridView({ items, attachmentCounts = {}, mini = false, ...actions }) {
  return (
    <div className={cn("grid gap-2", mini ? "grid-cols-1" : "grid-cols-2")}>
      {items.map((item) => (
        <GridCard
          key={item.id}
          item={item}
          attachmentCount={attachmentCounts[item.id] || 0}
          {...actions}
        />
      ))}
    </div>
  )
}

function GridCard({ item, revealed, value, copied, attachmentCount, inFolder, ...actions }) {
  const type = getVaultType(item.type)
  const hasCustomColor = Boolean(item.color_bg)
  const isRevealed = Boolean(revealed[item.id])
  const { copy, edit } = makeItemActions(item, actions)
  const copyable = canCopyItem(item)

  return (
    <div
      onClick={copyable ? copy : undefined}
      onDoubleClick={edit}
      title={copyable ? "Click to copy · double-click to edit" : "Double-click to edit"}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card transition-colors duration-200",
        copyable ? "cursor-pointer hover:bg-accent/20" : "cursor-default",
        hasCustomColor && "sticky-note",
        copied[item.id] && "ring-1 ring-primary/40"
      )}
      style={
        hasCustomColor
          ? {
              background: `linear-gradient(145deg, ${item.color_bg}dd 0%, ${item.color_bg}99 100%)`,
              color: item.color_text || "var(--foreground)",
            }
          : {}
      }
    >
      {item.pinned && <span className="absolute inset-y-0 left-0 w-[3px] bg-primary/70" />}

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg border", type.color)}>
              <TypeIcon type={type} size={13} />
            </div>
            <h3 className="min-w-0 truncate text-[12px] font-semibold leading-snug">
              {item.title}
            </h3>
          </div>
          <FavoriteBtn item={item} onToggleFavorite={actions.onToggleFavorite} size={12} />
        </div>

        {item.type === "note" ? (
          item.notes && (
            <p className="line-clamp-5 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/70">
              {item.notes}
            </p>
          )
        ) : (
          <ValueRow
            item={item}
            type={type}
            revealed={isRevealed}
            value={value[item.id]}
            onToggleReveal={actions.onToggleReveal}
          />
        )}

        {getMetaText(item) && (
          <p className="truncate text-[10px] text-foreground/60">{getMetaText(item)}</p>
        )}

        {(item.url || (item.notes && item.type !== "note") || parseTagsString(item.tags).length > 0 || attachmentCount > 0) && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
            {item.url && <UrlLink url={item.url} />}
            {item.notes && item.type !== "note" && (
              <p className="line-clamp-1 min-w-0 flex-1 text-[10px] text-foreground/60">{item.notes}</p>
            )}
            <TagChips tags={item.tags} max={2} />
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-foreground/50">
                <IconPaperclip size={10} />
                {attachmentCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-1 px-2.5 py-1.5">
        {copyable && (
          <CopyBtn copied={copied[item.id]} onCopy={() => actions.onCopy(item)} />
        )}
        <div className="flex-1" />
        <ItemMenu
          item={item}
          inFolder={inFolder}
          onEdit={actions.onEdit}
          onTogglePin={actions.onTogglePin}
          onMove={actions.onMove}
          onRemoveFromFolder={actions.onRemoveFromFolder}
          onDelete={actions.onDelete}
        />
      </div>
    </div>
  )
}

/* ───── VIEW: List (compact rows) ───── */

export function VaultListView({ items, attachmentCounts = {}, ...actions }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/40">
      {items.map((item, idx) => (
        <ListRow
          key={item.id}
          item={item}
          attachmentCount={attachmentCounts[item.id] || 0}
          {...actions}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  )
}

function ListRow({ item, revealed, value, copied, attachmentCount, inFolder, isLast, ...actions }) {
  const type = getVaultType(item.type)
  const isRevealed = Boolean(revealed[item.id])
  const hasCustomColor = Boolean(item.color_bg)
  const { copy, edit } = makeItemActions(item, actions)
  const copyable = canCopyItem(item)

  return (
    <div
      onClick={copyable ? copy : undefined}
      onDoubleClick={edit}
      title={copyable ? "Click to copy · double-click to edit" : "Double-click to edit"}
      className={cn(
        "group flex items-center gap-2 px-2.5 py-1.5 transition-colors hover:bg-accent/40",
        copyable && "cursor-pointer",
        !isLast && "border-b border-border/30",
        hasCustomColor && "sticky-note",
        copied[item.id] && "bg-primary/5"
      )}
    >
      {item.pinned && <span className="h-4 w-[3px] shrink-0 rounded-full bg-primary/70" />}

      <div className={cn("flex size-5 shrink-0 items-center justify-center rounded border", type.color)}>
        <TypeIcon type={type} size={11} />
      </div>

      <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight">
        {item.title}
      </span>

      {item.type !== "note" && (
        <span
          className={cn(
            "max-w-[38%] shrink-0 truncate font-mono text-[11px]",
            isRevealed ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {isRevealed ? value[item.id] || "—" : maskedPreview(item)}
        </span>
      )}

      {attachmentCount > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-foreground/45">
          <IconPaperclip size={10} />
          {attachmentCount}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          actions.onToggleFavorite(item.id)
        }}
        className={cn(
          "shrink-0 cursor-pointer transition-all hover:scale-110",
          item.favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
        )}
        aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {item.favorite ? (
          <IconStarFilled size={12} className="text-amber-500" />
        ) : (
          <IconStar size={12} className="text-foreground/30 hover:text-amber-500" />
        )}
      </button>

      {copyable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            actions.onCopy(item)
          }}
          className={cn(
            "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
            copied[item.id]
              ? "bg-primary/10 text-primary"
              : "text-foreground/45 hover:bg-foreground/10 hover:text-foreground"
          )}
          aria-label="Copy"
          title="Copy"
        >
          {copied[item.id] ? <IconCheck size={12} /> : <IconCopy size={12} />}
        </button>
      )}

      <ItemMenu
        item={item}
        inFolder={inFolder}
        revealed={isRevealed}
        onToggleReveal={actions.onToggleReveal}
        onToggleFavorite={actions.onToggleFavorite}
        onEdit={actions.onEdit}
        onTogglePin={actions.onTogglePin}
        onMove={actions.onMove}
        onRemoveFromFolder={actions.onRemoveFromFolder}
        onDelete={actions.onDelete}
      />
    </div>
  )
}

/* ───── VIEW: Spotlight (one item, full detail) ───── */

export function VaultSpotlightView({ items, attachmentCounts = {}, ...actions }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <SpotlightCard
          key={item.id}
          item={item}
          attachmentCount={attachmentCounts[item.id] || 0}
          {...actions}
        />
      ))}
    </div>
  )
}

function SpotlightCard({ item, revealed, value, copied, attachmentCount, inFolder, ...actions }) {
  const type = getVaultType(item.type)
  const isRevealed = Boolean(revealed[item.id])
  const hasCustomColor = Boolean(item.color_bg)
  const { edit } = makeItemActions(item, actions)
  const copyable = canCopyItem(item)
  const meta = getMetaText(item)
  const tags = parseTagsString(item.tags)

  return (
    <div
      onDoubleClick={edit}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card p-3 transition-colors duration-200",
        hasCustomColor && "sticky-note",
        copied[item.id] && "ring-1 ring-primary/40"
      )}
      style={
        hasCustomColor
          ? {
              background: `linear-gradient(135deg, ${item.color_bg}cc 0%, ${item.color_bg}88 100%)`,
              color: item.color_text || "var(--foreground)",
            }
          : {}
      }
    >
      {item.pinned && <span className="absolute inset-y-0 left-0 w-[3px] bg-primary/70" />}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", type.color)}>
            <TypeIcon type={type} size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1 text-[13px] font-semibold leading-snug">
              {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
              <span className="truncate">{item.title}</span>
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-foreground/50">
              {[type.label, item.updated_at && formatDate(item.updated_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <FavoriteBtn item={item} onToggleFavorite={actions.onToggleFavorite} />
      </div>

      <div className="mt-2.5 space-y-2">
        {item.type === "note" ? (
          item.notes && (
            <p className="whitespace-pre-wrap rounded-lg bg-foreground/5 px-2.5 py-2 text-xs leading-relaxed text-foreground/70">
              {item.notes}
            </p>
          )
        ) : (
          <ValueRow
            item={item}
            type={type}
            revealed={isRevealed}
            value={value[item.id]}
            onToggleReveal={actions.onToggleReveal}
            large
          />
        )}

        {meta && <p className="text-[11px] text-foreground/60">{meta}</p>}

        {item.notes && item.type !== "note" && (
          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/60">
            {item.notes}
          </p>
        )}

        {(item.url || tags.length > 0 || attachmentCount > 0) && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
            {item.url && <UrlLink url={item.url} />}
            <TagChips tags={item.tags} max={8} />
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-foreground/50">
                <IconPaperclip size={10} />
                {attachmentCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {copyable && (
          <CopyBtn
            copied={copied[item.id]}
            block
            onCopy={() => actions.onCopy(item)}
          />
        )}
        <ItemMenu
          item={item}
          inFolder={inFolder}
          onEdit={actions.onEdit}
          onTogglePin={actions.onTogglePin}
          onMove={actions.onMove}
          onRemoveFromFolder={actions.onRemoveFromFolder}
          onDelete={actions.onDelete}
        />
      </div>
    </div>
  )
}
