import {
  FolderPlainIcon,
  FolderStackIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderCrossIcon,
  FolderSearchIcon,
  FolderSyncIcon,
  FolderStarIcon,
  FolderHeartIcon,
  FolderLockIcon,
  FolderCodeIcon,
  FolderBookIcon,
  FolderNoteIcon,
  FolderBriefcaseIcon,
  FolderUsersIcon,
  FolderMusicIcon,
  FolderPhotoIcon,
  FolderCloudIcon,
  FolderDownloadIcon,
  FolderDollarIcon,
  FolderClockIcon,
  FolderCheckIcon,
  FolderFlagIcon,
} from "@/components/folders/FolderIcons"

// Available folder icons. `id` is what we persist in the folders.icon column.
// Every entry is a real Windows 11 style folder; the colour picker below tints
// the folder body, the same way Explorer folders work.
export const FOLDER_ICON_OPTIONS = [
  { id: "folder", label: "Folder", Icon: FolderPlainIcon },
  { id: "folders", label: "Folder stack", Icon: FolderStackIcon },
  { id: "open", label: "Open folder", Icon: FolderOpenIcon },
  { id: "plus", label: "Add", Icon: FolderPlusIcon },
  { id: "cross", label: "Delete", Icon: FolderCrossIcon },
  { id: "search", label: "Search", Icon: FolderSearchIcon },
  { id: "sync", label: "Sync", Icon: FolderSyncIcon },
  { id: "star", label: "Starred", Icon: FolderStarIcon },
  { id: "heart", label: "Favorites", Icon: FolderHeartIcon },
  { id: "lock", label: "Secure", Icon: FolderLockIcon },
  { id: "code", label: "Code", Icon: FolderCodeIcon },
  { id: "book", label: "Docs", Icon: FolderBookIcon },
  { id: "note", label: "Notes", Icon: FolderNoteIcon },
  { id: "briefcase", label: "Work", Icon: FolderBriefcaseIcon },
  { id: "users", label: "People", Icon: FolderUsersIcon },
  { id: "music", label: "Music", Icon: FolderMusicIcon },
  { id: "photo", label: "Images", Icon: FolderPhotoIcon },
  { id: "cloud", label: "Cloud", Icon: FolderCloudIcon },
  { id: "download", label: "Downloads", Icon: FolderDownloadIcon },
  { id: "dollar", label: "Finance", Icon: FolderDollarIcon },
  { id: "clock", label: "Recent", Icon: FolderClockIcon },
  { id: "check", label: "Done", Icon: FolderCheckIcon },
  { id: "flag", label: "Flagged", Icon: FolderFlagIcon },
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

/**
 * Folder icons removed from the picker still live in the database, so unknown
 * ids resolve to the plain folder instead of breaking.
 */
export function resolveFolderIcon(iconId) {
  return ICON_MAP[iconId] || FolderPlainIcon
}

export function isValidFolderIcon(iconId) {
  return Boolean(ICON_MAP[iconId])
}

export function getFolderColorValue(color) {
  const value = typeof color === "string" ? color.trim() : ""
  return value || undefined
}
