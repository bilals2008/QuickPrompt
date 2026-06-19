import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PromptCardItem } from "@/components/prompt-card"
import { cn } from "@/lib/utils"

export function SortablePromptCard({ id, prompt, viewMode, onCopy, onDelete, onToggleFavorite, allTags, mini, onSaved, autoCopy, display }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
  }

  const dragHandle = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex shrink-0 cursor-grab items-center justify-center rounded-md p-0.5 text-muted-foreground",
            "transition-colors hover:bg-accent hover:text-foreground",
            "active:cursor-grabbing",
            isDragging && "text-primary"
          )}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <IconGripVertical className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        Drag to reorder
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "z-50 opacity-50",
        !isDragging && "relative"
      )}
    >
      <PromptCardItem
        prompt={prompt}
        viewMode={viewMode}
        onCopy={onCopy}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        allTags={allTags}
        mini={mini}
        onSaved={onSaved}
        autoCopy={autoCopy}
        display={display}
        dragHandle={dragHandle}
      />
    </div>
  )
}
