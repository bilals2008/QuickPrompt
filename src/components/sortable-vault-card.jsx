import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function SortableVaultCard({ id, children, disabled = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-80")}
    >
      {children({
        dragHandle: (
          <button
            {...attributes}
            {...listeners}
            disabled={disabled}
            className="flex shrink-0 cursor-grab items-center justify-center rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <IconGripVertical size={14} />
          </button>
        ),
      })}
    </div>
  )
}