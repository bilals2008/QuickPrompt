import { cn } from "@/lib/utils"
import {
  resolveFolderIcon,
  getFolderColorValue,
  getFolderPixelSize,
  DEFAULT_FOLDER_COLOR_CLASS,
} from "@/lib/folder-appearance"

export function FolderGlyph({
  folder,
  size,
  strokeWidth = 1.5,
  showCustom = true,
  className,
}) {
  const resolvedSize = size ?? (showCustom ? getFolderPixelSize(folder) : 28)
  const Icon = resolveFolderIcon(showCustom ? folder?.icon : "folder")
  const color = showCustom ? getFolderColorValue(folder?.color) : undefined
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
