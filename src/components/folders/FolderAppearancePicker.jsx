import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FOLDER_ICON_OPTIONS, FOLDER_COLOR_OPTIONS, FOLDER_SIZE_OPTIONS, parseAppearance } from "@/lib/folder-appearance"

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
  appearance = "",
  onIconChange,
  onColorChange,
  onSizeChange,
  onAppearanceChange,
  className,
}) {
  const [hexDraft, setHexDraft] = useState(color || "")
  const [iconSearch, setIconSearch] = useState("")
  const fileInputRef = useRef(null)
  const appearanceData = parseAppearance(appearance)
  const customIcon = appearanceData.customIcon || null

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

  const handleCustomIconUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      onAppearanceChange?.(JSON.stringify({ ...appearanceData, customIcon: dataUrl }))
      onIconChange?.("custom")
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const clearCustomIcon = () => {
    const { customIcon: _, ...rest } = appearanceData
    onAppearanceChange?.(JSON.stringify(rest))
    onIconChange?.("folder")
  }

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
        <div className="grid max-h-[240px] grid-cols-5 gap-2 overflow-y-auto pr-1">
          {filteredIcons.length === 0 && (
            <p className="col-span-5 py-2 text-center text-[11px] text-muted-foreground">No icons match.</p>
          )}
          {filteredIcons.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={icon === id}
              onClick={() => {
                onIconChange(id)
                if (id !== "custom" && customIcon) clearCustomIcon()
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                icon === id && !customIcon
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon size={24} />
              <span className="w-full truncate text-center text-[9px] leading-tight">{label}</span>
            </button>
          ))}

          {/* Custom image upload button */}
          {onAppearanceChange && (
            <button
              type="button"
              title="Upload custom image"
              aria-label="Upload custom image"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                customIcon
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {customIcon ? (
                <img src={customIcon} alt="Custom" className="size-6 rounded-sm object-cover" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
              <span className="w-full truncate text-center text-[9px] leading-tight">Custom</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCustomIconUpload}
          aria-hidden="true"
          tabIndex={-1}
        />
        {customIcon && (
          <button
            type="button"
            onClick={clearCustomIcon}
            className="mt-1.5 cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Remove custom image
          </button>
        )}
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
