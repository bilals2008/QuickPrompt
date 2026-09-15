import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { IconSearch, IconPlus } from "@tabler/icons-react"
import {
  IconFolder, IconFolderPlus, IconFolderStar, IconFolderHeart,
  IconFolderCheck, IconFolderCode, IconFolderOpen,
  IconStar, IconStarFilled, IconHeart, IconHeartFilled,
  IconBookmark, IconLock, IconKey,
  IconShield, IconRocket, IconBolt,
  IconFlame, IconCode, IconTerminal,
  IconFile, IconFileText,
  IconPhoto, IconDownload, IconCloud, IconDatabase,
  IconLink, IconMail, IconSend, IconPhone,
  IconWorld, IconSettings,
  IconUser, IconUsers, IconCheck, IconX,
  IconEye, IconClock, IconBell, IconPin,
  IconBookmarkFilled, IconHeartFilled,
} from "@tabler/icons-react"

export const TABLER_ICONS = [
  { id: "tabler:folder", name: "Folder", Component: IconFolder },
  { id: "tabler:folder-plus", name: "Folder plus", Component: IconFolderPlus },
  { id: "tabler:folder-star", name: "Folder star", Component: IconFolderStar },
  { id: "tabler:folder-heart", name: "Folder heart", Component: IconFolderHeart },
  { id: "tabler:folder-check", name: "Folder check", Component: IconFolderCheck },
  { id: "tabler:folder-code", name: "Folder code", Component: IconFolderCode },
  { id: "tabler:folder-open", name: "Folder open", Component: IconFolderOpen },
  { id: "tabler:star", name: "Star", Component: IconStar },
  { id: "tabler:star-filled", name: "Star filled", Component: IconStarFilled },
  { id: "tabler:heart", name: "Heart", Component: IconHeart },
  { id: "tabler:heart-filled", name: "Heart filled", Component: IconHeartFilled },
  { id: "tabler:bookmark", name: "Bookmark", Component: IconBookmark },
  { id: "tabler:bookmark-filled", name: "Bookmark filled", Component: IconBookmarkFilled },
  { id: "tabler:lock", name: "Lock", Component: IconLock },
  { id: "tabler:key", name: "Key", Component: IconKey },
  { id: "tabler:shield", name: "Shield", Component: IconShield },
  { id: "tabler:rocket", name: "Rocket", Component: IconRocket },
  { id: "tabler:bolt", name: "Bolt", Component: IconBolt },
  { id: "tabler:flame", name: "Flame", Component: IconFlame },
  { id: "tabler:code", name: "Code", Component: IconCode },
  { id: "tabler:terminal", name: "Terminal", Component: IconTerminal },
  { id: "tabler:file", name: "File", Component: IconFile },
  { id: "tabler:file-text", name: "File text", Component: IconFileText },
  { id: "tabler:photo", name: "Photo", Component: IconPhoto },
  { id: "tabler:download", name: "Download", Component: IconDownload },
  { id: "tabler:cloud", name: "Cloud", Component: IconCloud },
  { id: "tabler:database", name: "Database", Component: IconDatabase },
  { id: "tabler:link", name: "Link", Component: IconLink },
  { id: "tabler:mail", name: "Mail", Component: IconMail },
  { id: "tabler:send", name: "Send", Component: IconSend },
  { id: "tabler:phone", name: "Phone", Component: IconPhone },
  { id: "tabler:world", name: "World", Component: IconWorld },
  { id: "tabler:settings", name: "Settings", Component: IconSettings },
  { id: "tabler:user", name: "User", Component: IconUser },
  { id: "tabler:users", name: "Users", Component: IconUsers },
  { id: "tabler:check", name: "Check", Component: IconCheck },
  { id: "tabler:x", name: "X", Component: IconX },
  { id: "tabler:eye", name: "Eye", Component: IconEye },
  { id: "tabler:clock", name: "Clock", Component: IconClock },
  { id: "tabler:bell", name: "Bell", Component: IconBell },
  { id: "tabler:pin", name: "Pin", Component: IconPin },
]

export function getTablerIcon(id) {
  if (!id || !id.startsWith("tabler:")) return null
  const entry = TABLER_ICONS.find((i) => i.id === id)
  return entry?.Component ?? null
}

export function TablerIconPicker({ selected, onSelect, className }) {
  const [search, setSearch] = useState("")
  const filtered = TABLER_ICONS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={className}>
      <div className="relative mb-2">
        <IconSearch size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="h-7 pl-7 text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="No icon"
              onClick={() => onSelect(null)}
              className={cn(
                "flex size-9 items-center justify-center rounded-md border text-[10px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              none
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            No icon
          </TooltipContent>
        </Tooltip>
        {filtered.map(({ id, name, Component }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={name}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Component size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              {name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
