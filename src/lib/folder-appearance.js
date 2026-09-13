import {
  IconFolderFilled,
  IconFolders,
  IconFolderStar,
  IconFolderHeart,
  IconFolderCode,
  IconBriefcase,
  IconBook,
  IconNote,
  IconTag,
  IconBulb,
  IconRocket,
  IconBookmark,
  IconArchive,
  IconMusic,
  IconPhoto,
  IconCamera,
  IconPalette,
  IconChartBar,
  IconGlobe,
  IconHome,
  IconUsers,
  IconShield,
  IconFlame,
  IconLeaf,
  IconSparkles,
  IconPin,
  IconFlag,
} from "@tabler/icons-react"

// Available folder icons. `id` is what we persist in the folders.icon column.
export const FOLDER_ICON_OPTIONS = [
  { id: "folder", label: "Folder", Icon: IconFolderFilled },
  { id: "folders", label: "Collection", Icon: IconFolders },
  { id: "star", label: "Starred", Icon: IconFolderStar },
  { id: "heart", label: "Favorites", Icon: IconFolderHeart },
  { id: "code", label: "Code", Icon: IconFolderCode },
  { id: "briefcase", label: "Work", Icon: IconBriefcase },
  { id: "book", label: "Docs", Icon: IconBook },
  { id: "note", label: "Notes", Icon: IconNote },
  { id: "tag", label: "Tags", Icon: IconTag },
  { id: "bulb", label: "Ideas", Icon: IconBulb },
  { id: "rocket", label: "Launch", Icon: IconRocket },
  { id: "bookmark", label: "Saved", Icon: IconBookmark },
  { id: "archive", label: "Archive", Icon: IconArchive },
  { id: "music", label: "Music", Icon: IconMusic },
  { id: "photo", label: "Images", Icon: IconPhoto },
  { id: "camera", label: "Camera", Icon: IconCamera },
  { id: "palette", label: "Design", Icon: IconPalette },
  { id: "chart", label: "Data", Icon: IconChartBar },
  { id: "globe", label: "Web", Icon: IconGlobe },
  { id: "home", label: "Home", Icon: IconHome },
  { id: "users", label: "People", Icon: IconUsers },
  { id: "shield", label: "Secure", Icon: IconShield },
  { id: "flame", label: "Hot", Icon: IconFlame },
  { id: "leaf", label: "Nature", Icon: IconLeaf },
  { id: "sparkles", label: "Magic", Icon: IconSparkles },
  { id: "pin", label: "Pinned", Icon: IconPin },
  { id: "flag", label: "Flagged", Icon: IconFlag },
]

// Empty value means "use the theme default" (yellow folder).
export const FOLDER_COLOR_OPTIONS = [
  { value: "", label: "Default" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#f97316", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#ec4899", label: "Pink" },
  { value: "#a855f7", label: "Purple" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#22c55e", label: "Green" },
  { value: "#84cc16", label: "Lime" },
  { value: "#eab308", label: "Yellow" },
  { value: "#64748b", label: "Slate" },
]

export const DEFAULT_FOLDER_APPEARANCE = { icon: "folder", color: "" }

export const DEFAULT_FOLDER_COLOR_CLASS = "text-yellow-500/80"

const ICON_MAP = Object.fromEntries(FOLDER_ICON_OPTIONS.map((o) => [o.id, o.Icon]))

export function resolveFolderIcon(iconId) {
  return ICON_MAP[iconId] || IconFolderFilled
}

export function isValidFolderIcon(iconId) {
  return Boolean(ICON_MAP[iconId])
}

export function getFolderColorValue(color) {
  const value = typeof color === "string" ? color.trim() : ""
  return value || undefined
}
