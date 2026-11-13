import { cn } from "@/lib/utils"
import {
  resolveFolderIcon,
  getFolderColorValue,
  getFolderPixelSize,
  getFolderEmblem,
  isCustomFolderIcon,
  isTablerFolderIcon,
  DEFAULT_FOLDER_EMBLEM,
  DEFAULT_FOLDER_COLOR_CLASS,
} from "@/lib/folder-appearance"
import { getTablerIcon } from "@/components/icons/TablerIconPicker"
import { FolderEmblemIcon, TablerEmblem, ImageEmblem } from "@/components/folders/FolderIcons"

// Neutral accent for user-picked emblems when the folder has no colour of its own.
const DEFAULT_EMBLEM_COLOR = "#475569"

export function FolderGlyph({
  folder,
  size,
  strokeWidth = 1.5,
  showCustom = true,
  className,
}) {
  const resolvedSize = size ?? (showCustom ? getFolderPixelSize(folder) : 28)
  const iconId = showCustom ? folder?.icon : "folder"
  const color = showCustom ? getFolderColorValue(folder?.color) : undefined
  const emblem = showCustom ? getFolderEmblem(folder) : { ...DEFAULT_FOLDER_EMBLEM }
  const emblemColor = emblem.color || color || DEFAULT_EMBLEM_COLOR

  // User-picked icons (uploaded image or Tabler glyph) sit in the folder badge,
  // the same place the built-in emblems live.
  if (isCustomFolderIcon(iconId)) {
    return (
      <FolderEmblemIcon
        size={resolvedSize}
        style={color ? { color } : undefined}
        className={cn(!color && DEFAULT_FOLDER_COLOR_CLASS, className)}
        emblem={<ImageEmblem href={iconId} />}
        emblemColor={emblemColor}
        badgeScale={emblem.scale}
        showBadge={emblem.badge !== "none"}
        emblemOffset={{ dx: emblem.dx, dy: emblem.dy }}
      />
    )
  }

  if (isTablerFolderIcon(iconId)) {
    const TablerIcon = getTablerIcon(iconId)
    if (TablerIcon) {
      return (
        <FolderEmblemIcon
          size={resolvedSize}
          style={color ? { color } : undefined}
          className={cn(!color && DEFAULT_FOLDER_COLOR_CLASS, className)}
          emblem={<TablerEmblem Icon={TablerIcon} />}
          emblemColor={emblemColor}
          badgeScale={emblem.scale}
          showBadge={emblem.badge !== "none"}
          emblemOffset={{ dx: emblem.dx, dy: emblem.dy }}
        />
      )
    }
  }

  const Icon = resolveFolderIcon(iconId)
  return (
    <Icon
      size={resolvedSize}
      strokeWidth={strokeWidth}
      style={color ? { color } : undefined}
      className={cn(!color && DEFAULT_FOLDER_COLOR_CLASS, "shrink-0", className)}
    />
  )
}

export default FolderGlyph
