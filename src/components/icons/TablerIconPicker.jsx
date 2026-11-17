import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { IconSearch } from "@tabler/icons-react"
import {
  IconFolder, IconFolderPlus, IconFolderStar, IconFolderHeart,
  IconFolderCheck, IconFolderCode, IconFolderOpen,
  IconFolderX, IconFolderCog, IconFolderMinus, IconFolderSymlink,
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
  IconBookmarkFilled,
  IconHome, IconBriefcase, IconBuilding, IconShoppingBag,
  IconAtom, IconPlant, IconBasket, IconTool,
  IconApi, IconWebhook, IconTopologyStar, IconSparkles,
  IconConfetti, IconTrophy, IconTarget, IconBulb,
  IconMessage, IconVideo, IconPalette, IconBrush,
  IconWand, IconCpu, IconServer, IconGitBranch,
  IconBug, IconTestPipe, IconSchool, IconBook,
  IconNotebook, IconSticker, IconPackage, IconVersions,
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
  { id: "tabler:folder-x", name: "Folder delete", Component: IconFolderX },
  { id: "tabler:folder-cog", name: "Folder settings", Component: IconFolderCog },
  { id: "tabler:folder-minus", name: "Folder remove", Component: IconFolderMinus },
  { id: "tabler:folder-symlink", name: "Folder link", Component: IconFolderSymlink },
  { id: "tabler:home", name: "Home", Component: IconHome },
  { id: "tabler:briefcase", name: "Work", Component: IconBriefcase },
  { id: "tabler:building", name: "Company", Component: IconBuilding },
  { id: "tabler:shopping-bag", name: "Shopping", Component: IconShoppingBag },
  { id: "tabler:atom", name: "Science", Component: IconAtom },
  { id: "tabler:plant", name: "Nature", Component: IconPlant },
  { id: "tabler:basket", name: "Basket", Component: IconBasket },
  { id: "tabler:tool", name: "Tools", Component: IconTool },
  { id: "tabler:api", name: "API", Component: IconApi },
  { id: "tabler:webhook", name: "Webhook", Component: IconWebhook },
  { id: "tabler:topology-star", name: "Network", Component: IconTopologyStar },
  { id: "tabler:sparkles", name: "AI", Component: IconSparkles },
  { id: "tabler:confetti", name: "Fun", Component: IconConfetti },
  { id: "tabler:trophy", name: "Wins", Component: IconTrophy },
  { id: "tabler:target", name: "Goals", Component: IconTarget },
  { id: "tabler:bulb", name: "Ideas", Component: IconBulb },
  { id: "tabler:message", name: "Chat", Component: IconMessage },
  { id: "tabler:video", name: "Video", Component: IconVideo },
  { id: "tabler:palette", name: "Design", Component: IconPalette },
  { id: "tabler:brush", name: "Creative", Component: IconBrush },
  { id: "tabler:wand", name: "Magic", Component: IconWand },
  { id: "tabler:cpu", name: "Compute", Component: IconCpu },
  { id: "tabler:server", name: "Servers", Component: IconServer },
  { id: "tabler:git-branch", name: "Git", Component: IconGitBranch },
  { id: "tabler:bug", name: "Bugs", Component: IconBug },
  { id: "tabler:test-pipe", name: "Tests", Component: IconTestPipe },
  { id: "tabler:school", name: "Learning", Component: IconSchool },
  { id: "tabler:book", name: "Library", Component: IconBook },
  { id: "tabler:notebook", name: "Notes", Component: IconNotebook },
  { id: "tabler:sticker", name: "Sticker", Component: IconSticker },
  { id: "tabler:package", name: "Package", Component: IconPackage },
  { id: "tabler:versions", name: "Versions", Component: IconVersions },
]

export function getTablerIcon(id) {
  if (!id || !id.startsWith("tabler:")) return null
  const entry = TABLER_ICONS.find((i) => i.id === id)
  return entry?.Component ?? null
}

export function TablerIconPicker({ selected, onSelect, className, hideNone = false, maxVisible = 0 }) {
  const [search, setSearch] = useState("")
  const matches = TABLER_ICONS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )
  // Without a search term only a couple of rows show up; the rest is one
  // keystroke away.
  const filtered = maxVisible > 0 && !search.trim() ? matches.slice(0, maxVisible) : matches

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
        {!hideNone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="No icon"
                onClick={() => onSelect(null)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border text-[10px] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
        )}
        {filtered.map(({ id, name, Component }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={name}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
      {maxVisible > 0 && matches.length > maxVisible && !search.trim() && (
        <p className="mt-2 text-[10px] text-muted-foreground/80">
          Search to see all {matches.length} icons.
        </p>
      )}
    </div>
  )
}
