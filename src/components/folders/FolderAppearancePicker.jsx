import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FOLDER_ICON_OPTIONS, FOLDER_COLOR_OPTIONS, FOLDER_SIZE_OPTIONS } from "@/lib/folder-appearance"

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * Compact icon + color picker shared by the folder customize dialogs (prompt
 * and vault folders) and the Settings > Folders section. Includes a custom
 * hex/color wheel option on top of the presets.
 */
export function FolderAppearancePicker({
  icon,
  color,
  size = "normal",
  onIconChange,
  onColorChange,
  onSizeChange,
  className,
}) {
  const [hexDraft, setHexDraft] = useState(color || "")
  const [iconSearch, setIconSearch] = useState("")

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return FOLDER_ICON_OPTIONS
    const q = iconSearch.toLowerCase()
    return FOLDER_ICON_OPTIONS.filter((opt) =>
      opt.label.toLowerCase().includes(q) || opt.id.toLowerCase().includes(q)
    )
  }, [iconSearch])

  useEffect(() => {
    setHexDraft(color || "")
  }, [color])

  const commitHex = () => {
    const raw = hexDraft.trim()
    if (raw === "") {
      onColorChange("")
      return
    }
    const withHash = raw.startsWith("#") ? raw : `#${raw}`
    if (HEX_PATTERN.test(withHash)) {
      const normalized = withHash.toLowerCase()
      setHexDraft(normalized)
      onColorChange(normalized)
    } else {
      setHexDraft(color || "")
    }
  }

  const wheelValue = HEX_PATTERN.test(color || "") ? color : "#f59e0b"

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Icon
        </p>
        <div className="relative mb-2">
          <Input
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Search icons..."
            className="h-7 text-[11px]"
            aria-label="Search folder icons"
          />
        </div>
        <div className="flex max-h-[180px] flex-wrap gap-1.5 overflow-y-auto pr-1">
          {filteredIcons.length === 0 && (
            <p className="py-2 text-center text-[11px] text-muted-foreground">No icons match.</p>
          )}
          {filteredIcons.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={icon === id}
              onClick={() => onIconChange(id)}
              className={cn(
                "flex size-11 items-center justify-center rounded-lg border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon size={24} />
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

        {/* Custom color */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={wheelValue}
            onChange={(e) => onColorChange(e.target.value)}
            aria-label="Pick a custom color"
            className="size-7 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
          />
          <Input
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={commitHex}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitHex()
              }
            }}
            placeholder="Custom hex — #f59e0b"
            className="h-7 flex-1 font-mono text-[11px]"
            aria-label="Custom hex color"
          />
          {color && (
            <button
              type="button"
              onClick={() => onColorChange("")}
              className="shrink-0 cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {onSizeChange && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Size
          </p>
          <div className="flex gap-1">
            {FOLDER_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={size === opt.id}
                onClick={() => onSizeChange(opt.id)}
                className={cn(
                  "flex h-7 items-center justify-center rounded-md border px-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring text-[11px] font-medium",
                  size === opt.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FolderAppearancePicker
