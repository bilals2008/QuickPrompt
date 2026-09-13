import { cn } from "@/lib/utils"
import { IconCopy, IconStar, IconStarFilled, IconX } from "@tabler/icons-react"

export function PromptRow({
  prompt,
  index = 0,
  onCopy,
  onRemove,
  onToggleFavorite,
  isSelected,
  onSelect,
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-all duration-150",
        "hover:bg-accent/40",
        isSelected && "bg-accent/60 ring-1 ring-primary/30"
      )}
      style={{ animationDelay: `${Math.min(index * 15, 200)}ms`, animationFillMode: "backwards" }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className="shrink-0 cursor-pointer"
        aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {prompt.favorite ? (
          <IconStarFilled size={12} className="text-amber-400" />
        ) : (
          <IconStar size={12} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{prompt.title || "Untitled"}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">
          {prompt.content?.slice(0, 100)}
        </p>
      </div>
      {prompt.tags && (
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          {prompt.tags.split(",").slice(0, 3).map((tag, i) => (
            <span key={i} className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCopy(prompt.content)
          }}
          className="rounded p-1 transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer"
          title="Copy"
        >
          <IconCopy size={11} className="text-muted-foreground" />
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="rounded p-1 transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            title="Remove from folder"
          >
            <IconX size={11} className="text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}

export default PromptRow
