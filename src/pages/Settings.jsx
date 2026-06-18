// File: src/pages/Settings.jsx
import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconMoon,
  IconInfoCircle,
  IconPlayerPlay,
  IconCheck,
  IconSettings,
  IconArrowLeft,
  IconRefresh,
  IconDownload,
  IconLoader2,
  IconCircleCheck,
  IconAlertCircle,
  IconLayoutGrid,
  IconBell,
  IconMouse,
  IconX,
  IconPin,
  IconSparkles,
  IconTag,
  IconStar,
  IconCopy,
  IconClock,
  IconHeading,
  IconTextCaption,
  IconCategory,
  IconSearch,
  IconArrowsSort,
  IconCloudUpload,
  IconFolder,
  IconMaximize,
  IconMinimize,
  IconRuler,
  IconPalette,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import pkg from "../../package.json"
import { useCardDisplaySettings, DEFAULT_CARD_DISPLAY } from "@/hooks/useCardDisplaySettings"

const sections = [
  { id: "general", icon: IconPlayerPlay, label: "General" },
  { id: "customization", icon: IconCategory, label: "Customization" },
  { id: "backup", icon: IconCloudUpload, label: "Backup" },
  { id: "appearance", icon: IconMoon, label: "Appearance" },
  { id: "updates", icon: IconRefresh, label: "Updates" },
  { id: "about", icon: IconInfoCircle, label: "About" },
]

const themeCategories = [
  {
    label: "Light",
    themes: [
      {
        id: "light",
        label: "Light",
        desc: "Clean and bright",
        bg: "#ffffff",
        card: "#f1f5f9",
        accent: "#6366f1",
        text: "#0f1729",
      },
      {
        id: "nord",
        label: "Nord",
        desc: "Cool arctic blue",
        bg: "#eceff4",
        card: "#ffffff",
        accent: "#5e81ac",
        text: "#2e3440",
      },
      {
        id: "lavender",
        label: "Lavender",
        desc: "Soft purple elegance",
        bg: "#faf5ff",
        card: "#ffffff",
        accent: "#8b5cf6",
        text: "#1e1033",
      },
      {
        id: "solarized",
        label: "Solarized Light",
        desc: "Iconic warm beige",
        bg: "#fdf6e3",
        card: "#eee8d5",
        accent: "#268bd2",
        text: "#586e75",
      },
    ],
  },
  {
    label: "Dark",
    themes: [
      {
        id: "midnight",
        label: "Midnight",
        desc: "Dark with gold accents",
        bg: "#0f0f1a",
        card: "#1a1a2e",
        accent: "#fbbf24",
        text: "#e8e6f0",
      },
      {
        id: "dracula",
        label: "Dracula",
        desc: "Iconic purple palette",
        bg: "#282a36",
        card: "#2d3044",
        accent: "#bd93f9",
        text: "#f8f8f2",
      },
      {
        id: "tokyo-night",
        label: "Tokyo Night",
        desc: "City lights at dusk",
        bg: "#1a1b26",
        card: "#24283b",
        accent: "#7aa2f7",
        text: "#c0caf5",
      },
      {
        id: "cyberpunk",
        label: "Cyberpunk",
        desc: "Neon on dark",
        bg: "#0a0a0f",
        card: "#12121a",
        accent: "#00ff9f",
        text: "#e0e0e0",
      },
      {
        id: "catppuccin",
        label: "Catppuccin Mocha",
        desc: "Soothing pastel mauve",
        bg: "#1e1e2e",
        card: "#313244",
        accent: "#cba6f7",
        text: "#cdd6f4",
      },
      {
        id: "gruvbox",
        label: "Gruvbox Dark",
        desc: "Retro warm orange",
        bg: "#282828",
        card: "#32302f",
        accent: "#fe8019",
        text: "#ebdbb2",
      },
      {
        id: "dark",
        label: "Dark",
        desc: "Easy on the eyes",
        bg: "#0c0c14",
        card: "#161e34",
        accent: "#6366f1",
        text: "#ededee",
      },
      {
        id: "forest",
        label: "Forest",
        desc: "Natural green tones",
        bg: "#0d1a0d",
        card: "#142414",
        accent: "#4ade80",
        text: "#e2f0e2",
      },
      {
        id: "ocean",
        label: "Ocean",
        desc: "Deep blue vibes",
        bg: "#0a1628",
        card: "#12203a",
        accent: "#38bdf8",
        text: "#dce8f5",
      },
      {
        id: "sunset",
        label: "Sunset",
        desc: "Warm orange dusk",
        bg: "#1a0c0a",
        card: "#2a1410",
        accent: "#f97316",
        text: "#fde8d0",
      },
    ],
  },
]

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-primary" />
      )}
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2.5 sm:py-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-tight text-foreground">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
        {Icon && <Icon className="size-5 text-primary" />}
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function SettingGroup({ title, children, className }) {
  return (
    <div className={cn("rounded-xl border border-border/80 bg-card overflow-hidden", className)}>
      {title && (
        <div className="border-b border-border/60 bg-muted/30 px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
        </div>
      )}
      <div className="px-4">{children}</div>
    </div>
  )
}

function ThemeCard({ theme, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col rounded-xl border p-3 text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/30"
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 flex items-center justify-center size-5 rounded-full bg-primary shadow-sm">
          <IconCheck size={12} className="text-primary-foreground" />
        </div>
      )}
      <div
        className="mb-3 h-16 w-full rounded-lg border overflow-hidden"
        style={{ borderColor: theme.card }}
      >
        <div className="h-full w-full p-2" style={{ background: theme.bg }}>
          <div className="h-1.5 w-10 rounded-full mb-1.5" style={{ background: theme.accent }} />
          <div className="h-1 w-16 rounded-full opacity-40 mb-2" style={{ background: theme.text }} />
          <div className="flex gap-1">
            <div className="h-6 flex-1 rounded" style={{ background: theme.card }} />
            <div className="h-6 flex-1 rounded opacity-70" style={{ background: theme.card }} />
          </div>
        </div>
      </div>
      <p className="text-[13px] font-semibold text-foreground">{theme.label}</p>
      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{theme.desc}</p>
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState("general")
  const [sectionQuery, setSectionQuery] = useState("")
  const [updateStatus, setUpdateStatus] = useState("idle")
  const [updateInfo, setUpdateInfo] = useState(null)
  const [autoCheck, setAutoCheck] = useState(true)
  const [autoDownload, setAutoDownload] = useState(false)
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [closeBehavior, setCloseBehavior] = useState("tray")
  const [autoCopy, setAutoCopy] = useState(true)
  const [defaultView, setDefaultView] = useState("grid")
  const [notifications, setNotifications] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [cardDisplay, setCardDisplay] = useCardDisplaySettings()
  const [caseSensitiveSearch, setCaseSensitiveSearch] = useState(false)
  const [searchInTagsOnly, setSearchInTagsOnly] = useState(false)
  const [defaultWindowSize, setDefaultWindowSize] = useState("medium")
  const [startMinimized, setStartMinimized] = useState(false)
  const [autoBackup, setAutoBackup] = useState(false)
  const [backupLocation, setBackupLocation] = useState("")
  const [defaultSortOrder, setDefaultSortOrder] = useState("newest")
  const searchRef = useRef(null)

  useEffect(() => {
    window.updateAPI?.getAutoCheck()?.then((v) => setAutoCheck(v))
    window.updateAPI?.getAutoDownload()?.then((v) => setAutoDownload(v))
    window.updateAPI?.getStatus()?.then((s) => {
      if (s?.status) setUpdateStatus(s.status)
      if (s?.version) setUpdateInfo({ version: s.version, releaseNotes: s.releaseNotes })
    })

    window.settingsAPI?.get("closeBehavior", "tray").then((v) => setCloseBehavior(v))
    window.settingsAPI?.get("autoCopy", true).then((v) => setAutoCopy(v))
    window.settingsAPI?.get("defaultView", "grid").then((v) => setDefaultView(v))
    window.settingsAPI?.get("notifications", false).then((v) => setNotifications(v))
    window.settingsAPI?.get("caseSensitive", false).then((v) => setCaseSensitiveSearch(Boolean(v)))
    window.settingsAPI?.get("searchInTagsOnly", false).then((v) => setSearchInTagsOnly(Boolean(v)))
    window.settingsAPI?.get("defaultWindowSize", "medium").then((v) => setDefaultWindowSize(v))
    window.settingsAPI?.get("startMinimized", false).then((v) => setStartMinimized(Boolean(v)))
    window.settingsAPI?.get("autoBackup", false).then((v) => setAutoBackup(Boolean(v)))
    window.settingsAPI?.get("backupLocation", "").then((v) => setBackupLocation(v || ""))
    window.settingsAPI?.get("defaultSortOrder", "newest").then((v) => setDefaultSortOrder(v))
    window.windowAPI?.getAlwaysOnTop?.().then((v) => setAlwaysOnTop(Boolean(v)))

    const unsubscribe = window.updateAPI?.onEvent((event) => {
      setUpdateStatus(event.status)
      if (event.version) {
        setUpdateInfo({ version: event.version, releaseNotes: event.releaseNotes })
      }
      if (event.status === "available") {
        toast.success(`Update available: v${event.version}`)
      }
      if (event.status === "error") {
        toast.error("Update check failed")
      }
    })

    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    function onKey(e) {
      const tag = (e.target?.tagName || "").toLowerCase()
      const isEditable =
        tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable
      if (isEditable) return

      if (e.key === "/") {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape") {
        navigate("/")
      }
      const num = Number(e.key)
      if (num >= 1 && num <= sections.length) {
        setActiveSection(sections[num - 1].id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navigate])

  async function handleCheckUpdate() {
    setChecking(true)
    try {
      await window.updateAPI?.checkForUpdates()
    } catch {
      toast.error("Failed to check for updates")
    } finally {
      setChecking(false)
    }
  }

  async function handleDownloadUpdate() {
    setDownloading(true)
    try {
      await window.updateAPI?.downloadUpdate()
    } catch {
      toast.error("Failed to download update")
    } finally {
      setDownloading(false)
    }
  }

  function handleAutoCheckToggle(checked) {
    setAutoCheck(checked)
    window.updateAPI?.setAutoCheck(checked)
  }

  function handleAutoDownloadToggle(checked) {
    setAutoDownload(checked)
    window.updateAPI?.setAutoDownload(checked)
  }

  function handleCloseBehaviorChange(value) {
    setCloseBehavior(value)
    window.settingsAPI?.set("closeBehavior", value)
  }

  function handleAutoCopyToggle(checked) {
    setAutoCopy(checked)
    window.settingsAPI?.set("autoCopy", checked)
  }

  function handleDefaultViewChange(value) {
    setDefaultView(value)
    window.settingsAPI?.set("defaultView", value)
  }

  function handleNotificationsToggle(checked) {
    setNotifications(checked)
    window.settingsAPI?.set("notifications", checked)
  }

  async function handleAlwaysOnTopToggle(checked) {
    const res = await window.windowAPI?.setAlwaysOnTop?.(checked)
    if (res?.success) setAlwaysOnTop(res.value)
  }

  function handleCaseSensitive(checked) {
    setCaseSensitiveSearch(checked)
    window.settingsAPI?.set("caseSensitive", checked)
  }

  function handleSearchInTagsOnly(checked) {
    setSearchInTagsOnly(checked)
    window.settingsAPI?.set("searchInTagsOnly", checked)
  }

  function handleDefaultWindowSize(value) {
    setDefaultWindowSize(value)
    window.settingsAPI?.set("defaultWindowSize", value)
  }

  function handleStartMinimized(checked) {
    setStartMinimized(checked)
    window.settingsAPI?.set("startMinimized", checked)
  }

  function handleAutoBackup(checked) {
    setAutoBackup(checked)
    window.settingsAPI?.set("autoBackup", checked)
  }

  async function handlePickBackupLocation() {
    const res = await window.settingsAPI?.pickFolder()
    if (res?.success) {
      setBackupLocation(res.path)
      window.settingsAPI?.set("backupLocation", res.path)
    }
  }

  function handleDefaultSortOrder(value) {
    setDefaultSortOrder(value)
    window.settingsAPI?.set("defaultSortOrder", value)
  }

  const filteredSections = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase()
    if (!q) return sections
    return sections.filter(
      (s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    )
  }, [sectionQuery])

  const showSidebar = sidebarVisible

  const displayToggles = [
    {
      key: "showTitle",
      icon: IconHeading,
      label: "Show title",
      description: "Display the title at the top of each prompt card",
    },
    {
      key: "showBody",
      icon: IconTextCaption,
      label: "Show content",
      description: "Display the prompt body/content on each card",
    },
    {
      key: "showTags",
      icon: IconTag,
      label: "Show tags",
      description: "Display tag badges on prompt cards",
    },
    {
      key: "showStar",
      icon: IconStar,
      label: "Show favorite star",
      description: "Show the star button to mark prompts as favorite",
    },
    {
      key: "showCopyButton",
      icon: IconCopy,
      label: "Show copy button",
      description: "Display the inline copy button on each card",
    },
    {
      key: "showTimestamp",
      icon: IconClock,
      label: "Show timestamp",
      description: "Show when each prompt was created (e.g. 5m ago)",
    },
  ]

  async function handleCardDisplayToggle(key, checked) {
    await setCardDisplay({ [key]: checked })
  }

  async function handleResetDisplay() {
    await setCardDisplay({ ...DEFAULT_CARD_DISPLAY })
    toast.success("Display settings reset to defaults")
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border/40 bg-card/50 px-4">
        {!showSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <IconArrowLeft size={16} />
          </Button>
        )}
        <div className="flex flex-1 items-center justify-center gap-2 sm:justify-start">
          <IconSettings className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">Settings</h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <aside className="flex w-56 shrink-0 flex-col border-r border-border/40 bg-card/30">
            <div className="p-3">
              <div className="group/search relative flex h-8 items-center rounded-md border border-border/70 bg-background/80 px-2 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/40">
                <IconSearch size={14} className="shrink-0 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={sectionQuery}
                  onChange={(e) => setSectionQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault()
                      setSectionQuery("")
                      searchRef.current?.blur()
                    }
                  }}
                  placeholder="Search settings"
                  className="h-7 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                {sectionQuery ? (
                  <button
                    onClick={() => setSectionQuery("")}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <IconX size={12} />
                  </button>
                ) : (
                  <kbd className="pointer-events-none hidden h-4 select-none items-center rounded border border-border/60 bg-muted/60 px-1 font-mono text-[9px] font-medium text-muted-foreground sm:inline-flex">
                    /
                  </kbd>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1 px-3 pb-3">
              <nav className="flex flex-col gap-0.5">
                {filteredSections.map((section) => (
                  <NavItem
                    key={section.id}
                    icon={section.icon}
                    label={section.label}
                    active={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                  />
                ))}
                {filteredSections.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
                )}
              </nav>
            </ScrollArea>
          </aside>
        )}

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">

            {!showSidebar && (
              <div className="mb-5">
                <div className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-none -mx-4 px-4">
                  {sections.map((s) => (
                    <Tooltip key={s.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveSection(s.id)}
                          className={cn(
                            "flex items-center justify-center rounded-lg p-2.5 transition-all cursor-pointer shrink-0",
                            "sm:w-auto sm:px-3 sm:py-2 sm:gap-1.5",
                            activeSection === s.id
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                          )}
                        >
                          <s.icon size={18} className="sm:size-5" />
                          <span className="hidden sm:inline text-xs font-medium">{s.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {s.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "general" && (
              <section>
                <SectionHeading icon={IconPlayerPlay} title="General" description="Application preferences" />
                <div className="space-y-5">
                  <SettingGroup title="Behavior">
                    <SettingRow
                      icon={IconX}
                      label="Close behavior"
                      description="Minimize to tray or quit the application"
                    >
                      <Select value={closeBehavior} onValueChange={handleCloseBehaviorChange}>
                        <SelectTrigger className="w-[150px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tray">Minimize to tray</SelectItem>
                          <SelectItem value="quit">Quit app</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconMouse}
                      label="Auto-copy on click"
                      description="Copy prompt when clicked"
                    >
                      <Switch checked={autoCopy} onCheckedChange={handleAutoCopyToggle} className="cursor-pointer" />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconBell}
                      label="Notifications"
                      description="Show toast notifications"
                    >
                      <Switch checked={notifications} onCheckedChange={handleNotificationsToggle} className="cursor-pointer" />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconPin}
                      label="Always on top"
                      description="Keep window above other apps"
                    >
                      <Switch checked={alwaysOnTop} onCheckedChange={handleAlwaysOnTopToggle} className="cursor-pointer" />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconMinimize}
                      label="Start minimized to tray"
                      description="App launches in the background without showing the window"
                    >
                      <Switch checked={startMinimized} onCheckedChange={handleStartMinimized} className="cursor-pointer" />
                    </SettingRow>
                  </SettingGroup>

                  <SettingGroup title="Prompts">
                    <SettingRow
                      icon={IconLayoutGrid}
                      label="Default view"
                      description="Grid or list on startup"
                    >
                      <Select value={defaultView} onValueChange={handleDefaultViewChange}>
                        <SelectTrigger className="w-[120px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconArrowsSort}
                      label="Default sort order"
                      description="How prompts are sorted by default"
                    >
                      <Select value={defaultSortOrder} onValueChange={handleDefaultSortOrder}>
                        <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                          <SelectItem value="alpha">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconSearch}
                      label="Case-sensitive search"
                      description="Match exact case when searching prompts"
                    >
                      <Switch checked={caseSensitiveSearch} onCheckedChange={handleCaseSensitive} className="cursor-pointer" />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconTag}
                      label="Search in tags only"
                      description="Only search within tags, not title or content"
                    >
                      <Switch checked={searchInTagsOnly} onCheckedChange={handleSearchInTagsOnly} className="cursor-pointer" />
                    </SettingRow>
                  </SettingGroup>

                  <SettingGroup title="Window">
                    <SettingRow
                      icon={IconMaximize}
                      label="Default window size"
                      description="Window size on app startup"
                    >
                      <Select value={defaultWindowSize} onValueChange={handleDefaultWindowSize}>
                        <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mini">Mini (360px)</SelectItem>
                          <SelectItem value="medium">Medium (440px)</SelectItem>
                          <SelectItem value="full">Full (700px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </SettingGroup>

                  <SettingGroup title="Onboarding">
                    <SettingRow
                      icon={IconSparkles}
                      label="Reset onboarding"
                      description="Show welcome screen again on next launch"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={async () => {
                          await window.settingsAPI?.set("onboardingComplete", false)
                          toast.success("Onboarding reset. Restart app to see welcome screen.")
                        }}
                      >
                        Reset
                      </Button>
                    </SettingRow>
                  </SettingGroup>
                </div>
              </section>
            )}

            {activeSection === "customization" && (
              <section>
                <SectionHeading icon={IconCategory} title="App Customization" description="Control the look and behavior of prompt cards" />

                <div className="space-y-5">
                  <SettingGroup title="Visibility">
                    {displayToggles.map((t, idx) => (
                      <div key={t.key}>
                        {idx > 0 && <Separator />}
                        <SettingRow
                          icon={t.icon}
                          label={t.label}
                          description={t.description}
                        >
                          <Switch
                            checked={Boolean(cardDisplay[t.key])}
                            onCheckedChange={(checked) => handleCardDisplayToggle(t.key, checked)}
                            className="cursor-pointer"
                          />
                        </SettingRow>
                      </div>
                    ))}
                  </SettingGroup>

                  <SettingGroup title="Layout & Style">
                    <SettingRow
                      icon={IconRuler}
                      label="Card density"
                      description="How much spacing around card content"
                    >
                      <Select
                        value={cardDisplay.cardDensity || "normal"}
                        onValueChange={(v) => handleCardDisplayToggle("cardDensity", v)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconTextCaption}
                      label="Max lines in card"
                      description="Limit the prompt body text shown on cards"
                    >
                      <Select
                        value={String(cardDisplay.maxLines || 3)}
                        onValueChange={(v) => handleCardDisplayToggle("maxLines", Number(v))}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 lines</SelectItem>
                          <SelectItem value="3">3 lines</SelectItem>
                          <SelectItem value="5">5 lines</SelectItem>
                          <SelectItem value="0">No limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconPalette}
                      label="Match card color to tag"
                      description="Card tint matches its first tag color instead of random"
                    >
                      <Switch
                        checked={Boolean(cardDisplay.colorByTag)}
                        onCheckedChange={(checked) => handleCardDisplayToggle("colorByTag", checked)}
                        className="cursor-pointer"
                      />
                    </SettingRow>
                  </SettingGroup>

                  <SettingGroup title="Dialogs">
                    <SettingRow
                      icon={IconTag}
                      label="Show tag input"
                      description="Allow adding tags in the New/Edit prompt dialogs"
                    >
                      <Switch
                        checked={Boolean(cardDisplay.showTagInput)}
                        onCheckedChange={(checked) => handleCardDisplayToggle("showTagInput", checked)}
                        className="cursor-pointer"
                      />
                    </SettingRow>
                  </SettingGroup>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={handleResetDisplay}
                    >
                      Reset to defaults
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "backup" && (
              <section>
                <SectionHeading icon={IconCloudUpload} title="Backup" description="Automatically back up your prompts database" />
                <div className="space-y-5">
                  <SettingGroup>
                    <SettingRow
                      icon={IconCloudUpload}
                      label="Auto-backup"
                      description="Periodically save a copy of your prompts database"
                    >
                      <Switch checked={autoBackup} onCheckedChange={handleAutoBackup} className="cursor-pointer" />
                    </SettingRow>
                    <Separator />
                    <SettingRow
                      icon={IconFolder}
                      label="Backup location"
                      description={backupLocation ? backupLocation : "No folder selected"}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-xs h-8"
                        onClick={handlePickBackupLocation}
                      >
                        {backupLocation ? "Change" : "Select folder"}
                      </Button>
                    </SettingRow>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                          <IconDownload className="size-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">Backup now</p>
                          <p className="text-xs text-muted-foreground">Create a one-time backup of your data</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-xs"
                        disabled={!backupLocation}
                        onClick={async () => {
                          const res = await window.db?.backup()
                          if (res?.success) {
                            toast.success("Backup created!")
                          } else {
                            toast.error(res?.reason || "Backup failed")
                          }
                        }}
                      >
                        Backup now
                      </Button>
                    </div>
                  </SettingGroup>
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <SectionHeading icon={IconMoon} title="Appearance" description="Choose your theme" />
                <div className="space-y-6">
                  {themeCategories.map((category) => (
                    <div key={category.label}>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {category.label}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {category.themes.map((t) => (
                          <ThemeCard
                            key={t.id}
                            theme={t}
                            selected={theme === t.id}
                            onClick={() => {
                              setTheme(t.id)
                              toast.success(`${t.label} theme applied`)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "updates" && (
              <section>
                <SectionHeading icon={IconRefresh} title="Updates" description="Manage application updates" />
                <div className="space-y-5">
                  <SettingGroup>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                          <IconRefresh className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">Current version</p>
                          <p className="text-xs text-muted-foreground">v{pkg.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {updateStatus === "checking" && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconLoader2 className="size-3 animate-spin" />
                            Checking...
                          </div>
                        )}
                        {updateStatus === "idle" && (
                          <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <IconCircleCheck className="size-3" />
                            Up to date
                          </div>
                        )}
                        {updateStatus === "available" && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-500">
                            <IconDownload className="size-3" />
                            v{updateInfo?.version} available
                          </div>
                        )}
                        {updateStatus === "downloading" && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-500">
                            <IconLoader2 className="size-3 animate-spin" />
                            Downloading...
                          </div>
                        )}
                        {updateStatus === "downloaded" && (
                          <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <IconCircleCheck className="size-3" />
                            Ready to install
                          </div>
                        )}
                        {updateStatus === "error" && (
                          <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <IconAlertCircle className="size-3" />
                            Error
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <SettingRow
                      icon={IconRefresh}
                      label="Check for updates on startup"
                      description="Automatically check when app launches"
                    >
                      <Switch checked={autoCheck} onCheckedChange={handleAutoCheckToggle} className="cursor-pointer" />
                    </SettingRow>

                    <Separator />

                    <SettingRow
                      icon={IconDownload}
                      label="Auto-download updates"
                      description="Download updates automatically when available"
                    >
                      <Switch checked={autoDownload} onCheckedChange={handleAutoDownloadToggle} className="cursor-pointer" />
                    </SettingRow>

                    <Separator />

                    <div className="flex gap-2 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={handleCheckUpdate}
                        disabled={checking || updateStatus === "checking"}
                      >
                        {checking || updateStatus === "checking" ? (
                          <IconLoader2 className="size-3.5 animate-spin mr-1.5" />
                        ) : (
                          <IconRefresh className="size-3.5 mr-1.5" />
                        )}
                        Check for Updates
                      </Button>

                      {updateStatus === "available" && (
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          onClick={handleDownloadUpdate}
                          disabled={downloading}
                        >
                          {downloading ? (
                            <IconLoader2 className="size-3.5 animate-spin mr-1.5" />
                          ) : (
                            <IconDownload className="size-3.5 mr-1.5" />
                          )}
                          Download
                        </Button>
                      )}
                    </div>
                  </SettingGroup>
                </div>
              </section>
            )}

            {activeSection === "about" && (
              <section>
                <SectionHeading icon={IconInfoCircle} title={`About ${pkg.productName}`} description="Software information" />
                <div className="space-y-5">
                  <SettingGroup>
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
                        <IconSettings className="size-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{pkg.productName}</h3>
                      <p className="text-xs text-muted-foreground">Version {pkg.version}</p>
                    </div>

                    <Separator />

                    <div className="py-3">
                      <p className="px-1 text-xs text-muted-foreground leading-relaxed text-center">
                        {pkg.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Version</p>
                        <p className="text-xs font-medium text-foreground">{pkg.version}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Developer</p>
                        <p className="text-xs font-medium text-foreground">{pkg.author}</p>
                      </div>
                    </div>
                  </SettingGroup>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
