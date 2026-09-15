import { useState } from "react"
import { cn } from "@/lib/utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { getVaultType } from "@/components/vault-item-dialog"
import { maskValue } from "@/components/vault/VaultItemCard"
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
  IconChevronDown,
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

function FavoriteBtn({ item, onToggleFavorite }) {
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
        <IconStarFilled size={13} className="text-amber-500 drop-shadow-sm" />
      ) : (
        <IconStar size={13} className="text-foreground/30 transition-colors hover:text-amber-500" />
      )}
    </button>
  )
}

function ItemMenu({ item, inFolder, onEdit, onTogglePin, onMove, onRemoveFromFolder, onDelete }) {
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

function CopyBtn({ copied, onCopy }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCopy()
      }}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        copied
          ? "bg-primary/10 text-primary"
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
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/* ───── VIEW: Grid (default cards) ───── */

export function VaultGridView({ items, ...actions }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <GridCard key={item.id} item={item} {...actions} />
      ))}
    </div>
  )
}

function GridCard({ item, revealed, value, copied, attachmentCount, inFolder, ...actions }) {
  const type = getVaultType(item.type)
  const hasCustomColor = Boolean(item.color_bg)

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card transition-colors duration-200 hover:bg-accent/20",
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
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", type.color)}>
              <TypeIcon type={type} size={14} />
            </div>
            <div className="min-w-0">
              <h3 className="flex items-center gap-1 text-[13px] font-semibold leading-snug">
                {item.pinned && <IconPinFilled size={12} className="shrink-0 text-primary" />}
                <span className="truncate">{item.title}</span>
              </h3>
            </div>
          </div>
          <FavoriteBtn item={item} onToggleFavorite={actions.onToggleFavorite} />
        </div>

        {item.type === "note" ? (
          item.notes && (
            <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-foreground/70">
              {item.notes}
            </p>
          )
        ) : (
          <div className="flex min-h-[30px] items-center gap-2 rounded-lg bg-foreground/5 px-2 py-1.5">
            <TypeIcon type={type} size={13} />
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-mono text-xs",
                revealed[item.id] ? "text-foreground" : "text-foreground/70"
              )}
            >
              {revealed[item.id] ? value[item.id] || "—" : maskedPreview(item)}
            </span>
            <button
              onClick={() => actions.onToggleReveal(item)}
              className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label={revealed[item.id] ? "Hide" : "Reveal"}
            >
              {revealed[item.id] ? <IconEyeOff size={13} /> : <IconEye size={13} />}
            </button>
          </div>
        )}

        {getMetaText(item) && (
          <p className="text-[11px] text-foreground/60">{getMetaText(item)}</p>
        )}

        {(item.url || item.notes || parseTagsString(item.tags).length > 0 || attachmentCount > 0) && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {item.url && (
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
            {item.notes && item.type !== "note" && (
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
        )}
      </div>

      <div className="mt-auto flex items-center justify-between px-3 py-2">
        {item.type !== "note" && (
          <CopyBtn
            copied={copied[item.id]}
            onCopy={() => actions.onCopy(item)}
          />
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

/* ───── VIEW: Accordion (collapsible rows) ───── */

export function VaultAccordionView({ items, ...actions }) {
  const [openIds, setOpenIds] = useState(() => new Set())

  const toggleOpen = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={openIds.has(item.id)}
          onToggleOpen={() => toggleOpen(item.id)}
          {...actions}
        />
      ))}
    </div>
  )
}

function AccordionRow({
  item,
  open,
  onToggleOpen,
  revealed,
  value,
  copied,
  attachmentCount,
  inFolder,
  ...actions
}) {
  const type = getVaultType(item.type)
  const hasCustomColor = Boolean(item.color_bg)
  const meta = getMetaText(item)
  const hasDetails =
    item.url || parseTagsString(item.tags).length > 0 || attachmentCount > 0 || item.updated_at
  const isRevealed = Boolean(revealed[item.id])

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl bg-card transition-colors duration-200",
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
      <div className="flex items-center gap-2 py-1.5 pl-1.5 pr-2">
        <button
          onClick={onToggleOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-accent/30"
          aria-expanded={open}
        >
          <IconChevronDown
            size={13}
            className={cn(
              "shrink-0 text-foreground/40 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
          <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg border", type.color)}>
            <TypeIcon type={type} size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {item.pinned && <IconPinFilled size={11} className="shrink-0 text-primary" />}
              <span className="truncate text-[13px] font-semibold">{item.title}</span>
            </div>
            {meta && (
              <span className="mt-0.5 truncate text-[11px] text-foreground/50">{meta}</span>
            )}
          </div>
        </button>

        <FavoriteBtn item={item} onToggleFavorite={actions.onToggleFavorite} />
        {item.type !== "note" && (
          <CopyBtn copied={copied[item.id]} onCopy={() => actions.onCopy(item)} />
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

      <div className={cn("grid transition-all duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="space-y-2.5 px-3 pb-3 pt-1">
            {item.type === "note" ? (
              item.notes && (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/70">{item.notes}</p>
              )
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-2.5 py-2">
                <TypeIcon type={type} size={13} />
                <span
                  className={cn(
                    "min-w-0 flex-1 break-all font-mono text-xs",
                    isRevealed ? "text-foreground" : "text-foreground/70"
                  )}
                >
                  {isRevealed ? value[item.id] || "—" : maskedPreview(item)}
                </span>
                <button
                  onClick={() => actions.onToggleReveal(item)}
                  className="shrink-0 cursor-pointer rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label={isRevealed ? "Hide" : "Reveal"}
                >
                  {isRevealed ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                </button>
              </div>
            )}

            {item.notes && item.type !== "note" && (
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/60">{item.notes}</p>
            )}

            {hasDetails && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {item.url && (
                  <a
                    href={item.url}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.shellAPI?.openExternal(item.url)
                    }}
                    className="flex min-w-0 max-w-[60%] items-center gap-1 text-[11px] text-primary/80 transition-colors hover:text-primary"
                    title={item.url}
                  >
                    <IconLink size={10} className="shrink-0" />
                    <span className="truncate">{item.url.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                <TagChips tags={item.tags} max={8} />
                {attachmentCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-foreground/50">
                    <IconPaperclip size={10} />
                    {attachmentCount}
                  </span>
                )}
                {item.updated_at && (
                  <span className="ml-auto text-[10px] text-foreground/40">
                    {formatDate(item.updated_at)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
