import { cn } from "@/lib/utils"
import { FOLDER_ICON_OPTIONS, FOLDER_COLOR_OPTIONS } from "@/lib/folder-appearance"

/**
 * Compact icon + color picker shared by the folder customize dialog and the
 * Settings > Folders section. Designed to stay usable at the 360px mini width.
 */
export function FolderAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  className,
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Icon
        </p>
        <div className="flex flex-wrap gap-1">
          {FOLDER_ICON_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={icon === id}
              onClick={() => onIconChange(id)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon size={14} strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Color
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FOLDER_COLOR_OPTIONS.map((c) => {
            const selected = (color || "") === c.value
            return (
              <button
                key={c.label}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={selected}
                onClick={() => onColorChange(c.value)}
                style={c.value ? { background: c.value } : undefined}
                className={cn(
                  "relative size-6 rounded-full border transition-transform cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-110",
                  c.value ? "border-transparent" : "bg-yellow-500/80",
                  selected && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-popover"
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FolderAppearancePicker
