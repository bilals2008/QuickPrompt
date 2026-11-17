import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  FOLDER_ICON_OPTIONS,
  FOLDER_COLOR_OPTIONS,
  FOLDER_SIZE_OPTIONS,
  FOLDER_EMBLEM_SIZE_OPTIONS,
  FOLDER_EMBLEM_BADGE_OPTIONS,
  DEFAULT_FOLDER_APPEARANCE,
  DEFAULT_FOLDER_EMBLEM,
  CUSTOM_ICON_MAX_SIZE,
  isCustomFolderIcon,
  isTablerFolderIcon,
} from "@/lib/folder-appearance"
import { TablerIconPicker } from "@/components/icons/TablerIconPicker"

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_EMBLEM_OFFSET = 4

/**
 * Reads an image file and returns a downscaled PNG data URL. Downscaling in the
 * renderer keeps the icon crisp at every folder size while staying small
 * enough to hand over to the main process, which stores it as a real file.
 */
async function fileToIconDataUrl(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const image = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("decode failed"))
    el.src = dataUrl
  })

  const scale = Math.min(1, CUSTOM_ICON_MAX_SIZE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  canvas.getContext("2d").drawImage(image, 0, 0, width, height)
  return canvas.toDataURL("image/png")
}

function SectionToggle({ label, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-center gap-2 text-left"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex-1" />
      <span className="w-3 text-[13px] font-semibold leading-none text-muted-foreground">
        {open ? "−" : "+"}
      </span>
    </button>
  )
}

export function FolderAppearancePicker({
  icon,
  color,
  size = "normal",
  emblem = DEFAULT_FOLDER_EMBLEM,
  onIconChange,
  onColorChange,
  onSizeChange,
  onEmblemChange,
  className,
}) {
  const [hexDraft, setHexDraft] = useState(color || "")
  const [emblemHexDraft, setEmblemHexDraft] = useState(emblem.color || "")
  const [iconSearch, setIconSearch] = useState("")
  const [openSections, setOpenSections] = useState(() => new Set(["icon"]))
  const fileRef = useRef(null)
  const isCustom = isCustomFolderIcon(icon)
  const hasCenterIcon = isCustom || isTablerFolderIcon(icon)

  // Sections open independently: opening one never closes another.
  const toggleSection = (id) =>
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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

  useEffect(() => {
    setEmblemHexDraft(emblem.color || "")
  }, [emblem.color])

  const commitEmblemHex = () => {
    const raw = emblemHexDraft.trim()
    if (raw === "") {
      onEmblemChange?.({ ...emblem, color: "" })
      return
    }
    const withHash = raw.startsWith("#") ? raw : `#${raw}`
    if (HEX_PATTERN.test(withHash)) {
      const normalized = withHash.toLowerCase()
      setEmblemHexDraft(normalized)
      onEmblemChange?.({ ...emblem, color: normalized })
    } else {
      setEmblemHexDraft(emblem.color || "")
    }
  }

  const emblemHexValue = HEX_PATTERN.test(emblem.color || "") ? emblem.color : "#6366f1"

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

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("That file is not an image")
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be smaller than 5 MB")
      return
    }
    try {
      onIconChange(await fileToIconDataUrl(file))
      toast.success("Custom icon applied")
    } catch {
      toast.error("Could not read that image")
    }
  }

  const updateEmblem = (patch) => onEmblemChange?.({ ...emblem, ...patch })

  const nudge = (dx, dy) => {
    updateEmblem({
      dx: Math.max(-MAX_EMBLEM_OFFSET, Math.min(MAX_EMBLEM_OFFSET, emblem.dx + dx)),
      dy: Math.max(-MAX_EMBLEM_OFFSET, Math.min(MAX_EMBLEM_OFFSET, emblem.dy + dy)),
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("space-y-2", className)}>
        {/* ---------- Folder icon ---------- */}
        <div>
          <SectionToggle
            label="Folder icon"
            open={openSections.has("icon")}
            onToggle={() => toggleSection("icon")}
          />
          {openSections.has("icon") && (
            <div className="mt-2">
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
                  placeholder="Search folder icons..."
                  className="h-7 pl-7 text-[11px]"
                  aria-label="Search folder icons"
                />
              </div>
              <div className="grid max-h-[220px] grid-cols-5 gap-2 overflow-y-auto pr-1">
                {filteredIcons.length === 0 && (
                  <p className="col-span-5 py-2 text-center text-[11px] text-muted-foreground">
                    No icons match.
                  </p>
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
                          "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          icon === id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon size={24} />
                        <span className="w-full truncate text-center text-[9px] leading-tight">
                          {label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---------- Center icon ---------- */}
        <div className="border-t border-border/30 pt-2">
          <SectionToggle
            label="Center icon"
            open={openSections.has("center")}
            onToggle={() => toggleSection("center")}
          />
          {openSections.has("center") && (
            <div className="mt-2">
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload image
                </button>
                {isCustom && (
                  <span className="relative inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-2 py-1 text-[10px] text-primary">
                    <img src={icon} alt="" className="size-4 object-contain" />
                    Custom
                    <button
                      type="button"
                      aria-label="Remove custom icon"
                      onClick={() => onIconChange(DEFAULT_FOLDER_APPEARANCE.icon)}
                      className="cursor-pointer text-primary/70 hover:text-primary"
                    >
                      <IconX size={10} />
                    </button>
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                  aria-label="Upload custom folder icon"
                />
              </div>

              <TablerIconPicker
                hideNone
                maxVisible={18}
                selected={icon}
                onSelect={(id) => {
                  if (id) onIconChange(id)
                }}
              />

              {hasCenterIcon && onEmblemChange && (
                <div className="mt-3 space-y-3 rounded-lg border border-border/50 bg-muted/20 p-2">
                  <p className="text-[10px] font-medium text-muted-foreground">Badge style</p>

                  {/* color */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {FOLDER_COLOR_OPTIONS.map((c) => {
                        const selected = (emblem.color || "") === c.value
                        return (
                          <Tooltip key={c.label}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={c.label}
                                aria-pressed={selected}
                                onClick={() => updateEmblem({ color: c.value })}
                                style={c.value ? { background: c.value } : undefined}
                                className={cn(
                                  "relative size-5 cursor-pointer rounded-full border transition-transform outline-none focus-visible:ring-1 focus-visible:ring-ring hover:scale-110",
                                  c.value ? "border-transparent" : "bg-slate-500",
                                  selected && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-popover"
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{c.label}</TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={emblemHexValue}
                        onChange={(e) => updateEmblem({ color: e.target.value })}
                        aria-label="Pick a custom emblem color"
                        className="size-6 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
                      />
                      <Input
                        value={emblemHexDraft}
                        onChange={(e) => setEmblemHexDraft(e.target.value)}
                        onBlur={commitEmblemHex}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            commitEmblemHex()
                          }
                        }}
                        placeholder="Custom hex — #6366f1"
                        className="h-6 flex-1 font-mono text-[10px]"
                        aria-label="Custom emblem hex color"
                      />
                    </div>
                  </div>

                  {/* size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      {FOLDER_EMBLEM_SIZE_OPTIONS.map((opt) => {
                        const selected = Math.abs(emblem.scale - opt.scale) < 0.01
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            aria-label={`Badge size ${opt.label}`}
                            aria-pressed={selected}
                            onClick={() => updateEmblem({ scale: opt.scale })}
                            className={cn(
                              "flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border text-[10px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                      <span className="flex-1" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {emblem.scale.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.4"
                      step="0.05"
                      value={emblem.scale}
                      onChange={(e) => updateEmblem({ scale: Number(e.target.value) })}
                      aria-label="Custom badge size"
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                    />
                  </div>

                  {/* badge background */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Background</span>
                    {FOLDER_EMBLEM_BADGE_OPTIONS.map((opt) => {
                      const selected = (emblem.badge || "white") === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          aria-label={`Badge background ${opt.label}`}
                          aria-pressed={selected}
                          onClick={() => updateEmblem({ badge: opt.id })}
                          className={cn(
                            "flex h-6 cursor-pointer items-center rounded-md border px-2 text-[10px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* position */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Position</span>
                    <span className="flex-1" />
                    {[
                      { icon: IconArrowUp, dx: 0, dy: -1, label: "Move up" },
                      { icon: IconArrowDown, dx: 0, dy: 1, label: "Move down" },
                      { icon: IconArrowLeft, dx: -1, dy: 0, label: "Move left" },
                      { icon: IconArrowRight, dx: 1, dy: 0, label: "Move right" },
                    ].map(({ icon: ArrowIcon, dx, dy, label }) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={label}
                        onClick={() => nudge(dx, dy)}
                        className="flex size-6 cursor-pointer items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-foreground"
                      >
                        <ArrowIcon size={11} />
                      </button>
                    ))}
                    {(emblem.dx !== 0 || emblem.dy !== 0) && (
                      <button
                        type="button"
                        onClick={() => updateEmblem({ dx: 0, dy: 0 })}
                        className="cursor-pointer rounded-md px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------- Color ---------- */}
        <div className="border-t border-border/30 pt-2">
          <SectionToggle
            label="Color"
            open={openSections.has("color")}
            onToggle={() => toggleSection("color")}
          />
          {openSections.has("color") && (
            <div className="mt-2">
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
                            "relative size-6 cursor-pointer rounded-full border transition-transform outline-none focus-visible:ring-1 focus-visible:ring-ring hover:scale-110",
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
          )}
        </div>

        {/* ---------- Size ---------- */}
        {onSizeChange && (
          <div className="border-t border-border/30 pt-2">
            <SectionToggle
              label="Size"
              open={openSections.has("size")}
              onToggle={() => toggleSection("size")}
            />
            {openSections.has("size") && (
              <div className="mt-2 flex gap-1">
                {FOLDER_SIZE_OPTIONS.map((opt) => (
                  <Tooltip key={opt.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={opt.label}
                        aria-pressed={size === opt.id}
                        onClick={() => onSizeChange(opt.id)}
                        className={cn(
                          "flex h-7 cursor-pointer items-center justify-center rounded-md border px-2 text-[11px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default FolderAppearancePicker
