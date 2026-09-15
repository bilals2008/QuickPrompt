import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FOLDER_ICON_OPTIONS, FOLDER_COLOR_OPTIONS, FOLDER_SIZE_OPTIONS } from "@/lib/folder-appearance"

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

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
    <TooltipProvider delayDuration={300}>
      <div className={cn("space-y-4", className)}>
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Icon
          </p>
          <div className="relative mb-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <Input
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search icons..."
              className="h-7 pl-7 text-[11px]"
              aria-label="Search folder icons"
            />
          </div>
          <Separator className="mb-2" />
          <div className="grid max-h-[240px] grid-cols-5 gap-2 overflow-y-auto pr-1">
            {/* Custom upload - disabled, coming soon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled
                  className="pointer-events-none flex flex-col items-center gap-1 rounded-lg border border-dashed border-border/40 p-1.5 opacity-50"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="w-full truncate text-center text-[9px] leading-tight">Soon</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>

            {filteredIcons.length === 0 && (
              <p className="col-span-5 py-2 text-center text-[11px] text-muted-foreground">No icons match.</p>
            )}
            {filteredIcons.map(({ id, label, Icon }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={label}
                    aria-pressed={icon === id}
                    onClick={() => onIconChange(id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      icon === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon size={24} />
                    <span className="w-full truncate text-center text-[9px] leading-tight">{label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Color
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FOLDER_COLOR_OPTIONS.map((c) => {
              const selected = (color || "") === c.value
              return (
                <Tooltip key={c.label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
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
                  </TooltipTrigger>
                  <TooltipContent>{c.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>

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
                <Tooltip key={opt.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
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
                  </TooltipTrigger>
                  <TooltipContent>{opt.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default FolderAppearancePicker
