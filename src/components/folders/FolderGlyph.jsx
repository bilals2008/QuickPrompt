import { cn } from "@/lib/utils"
import {
  resolveFolderIcon,
  getFolderColorValue,
  getFolderPixelSize,
  DEFAULT_FOLDER_COLOR_CLASS,
} from "@/lib/folder-appearance"

/**
 * Renders a folder's custom icon + color. Falls back to the themed yellow
 * folder when no customization is set (or when `showCustom` is off).
 * When no `size` prop is passed, reads the folder's appearance size setting.
 */
export function FolderGlyph({
  folder,
  size,
  strokeWidth = 1.5,
  showCustom = true,
  className,
}) {
  const Icon = resolveFolderIcon(showCustom ? folder?.icon : "folder")
  const color = showCustom ? getFolderColorValue(folder?.color) : undefined
  const resolvedSize = size ?? (showCustom ? getFolderPixelSize(folder) : 28)
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
