import { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  IconMoon,
  IconInfoCircle,
  IconPlayerPlay,
  IconCheck,
  IconSettings,
  IconMessage,
  IconArrowLeft,
  IconRefresh,
  IconDownload,
  IconLoader2,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import pkg from "../../package.json"

const sections = [
  { id: "general", icon: IconPlayerPlay, label: "General" },
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
    ],
  },
  {
    label: "Dark",
    themes: [
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
    ],
  },
]

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { sidebarVisible } = useOutletContext()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState("appearance")
  const [updateStatus, setUpdateStatus] = useState("idle")
  const [updateInfo, setUpdateInfo] = useState(null)
  const [autoCheck, setAutoCheck] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    window.updateAPI?.getAutoCheck()?.then((v) => setAutoCheck(v))

    const unsubscribe = window.updateAPI?.onEvent((event) => {
      setUpdateStatus(event.status)
      if (event.version) {
        setUpdateInfo({ version: event.version, releaseNotes: event.releaseNotes })
      }
      if (event.status === "available") {
        toast.success(`Update available: v${event.version}`)
      }
      if (event.status === "downloaded") {
        toast.success(`Update downloaded: v${event.version}. Restart to install.`)
      }
      if (event.status === "error") {
        toast.error("Update check failed")
      }
    })

    return () => unsubscribe?.()
  }, [])

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

  function handleInstallUpdate() {
    window.updateAPI?.installUpdate()
  }

  function handleAutoCheckToggle(checked) {
    setAutoCheck(checked)
    window.updateAPI?.setAutoCheck(checked)
  }

  const showSidebar = sidebarVisible

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/30 bg-card/50 px-4">
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
        <IconSettings className="size-4 text-primary" />
        <h1 className="text-base font-bold tracking-tight text-primary">Settings</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <nav className="w-44 shrink-0 border-r border-border/30 bg-card/30 p-3 flex flex-col gap-1">
            {sections.map((section) => (
              <NavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </nav>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">

            {!showSidebar && (
              <div className="mb-4 flex justify-center gap-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <s.icon size={14} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {activeSection === "general" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">General</h2>
                  <p className="text-xs text-muted-foreground">Application preferences</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <SettingRow
                    icon={IconMessage}
                    label="Default editor"
                    description="New prompt dialog opens by default"
                  >
                    <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground tracking-wide cursor-default">
                      Coming soon
                    </span>
                  </SettingRow>
                  <Separator className="my-1" />
                  <SettingRow
                    icon={IconPlayerPlay}
                    label="Launch at startup"
                    description="Open QuickPrompt when you log in"
                  >
                    <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground tracking-wide cursor-default">
                      Coming soon
                    </span>
                  </SettingRow>
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                  <p className="text-xs text-muted-foreground">Choose your theme</p>
                </div>
                <div className="space-y-5">
                  {themeCategories.map((category) => (
                    <div key={category.label}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{category.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {category.themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id)
                              toast.success(`${t.label} theme applied`)
                            }}
                            className={cn(
                              "group relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer",
                              theme === t.id
                                ? "border-primary shadow-sm"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            {theme === t.id && (
                              <div className="absolute top-3 right-3 flex items-center justify-center size-5 rounded-full bg-primary">
                                <IconCheck size={12} className="text-primary-foreground" />
                              </div>
                            )}
                            <div
                              className="rounded-lg border overflow-hidden mb-3"
                              style={{ borderColor: t.card }}
                            >
                              <div style={{ background: t.bg, padding: "12px" }}>
                                <div
                                  className="h-2 w-16 rounded-full mb-2"
                                  style={{ background: t.accent }}
                                />
                                <div
                                  className="h-1.5 w-24 rounded-full mb-1.5 opacity-40"
                                  style={{ background: t.text }}
                                />
                                <div
                                  className="rounded p-2 flex gap-1.5"
                                  style={{ background: t.card }}
                                >
                                  <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: t.accent }}
                                  />
                                  <div
                                    className="h-1.5 w-1.5 rounded-full opacity-30"
                                    style={{ background: t.text }}
                                  />
                                  <div
                                    className="h-1.5 w-1.5 rounded-full opacity-30"
                                    style={{ background: t.text }}
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-foreground">{t.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "updates" && (
              <section>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Updates</h2>
                  <p className="text-xs text-muted-foreground">Manage application updates</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconRefresh className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Current version</p>
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
                    <Switch
                      checked={autoCheck}
                      onCheckedChange={handleAutoCheckToggle}
                      className="cursor-pointer"
                    />
                  </SettingRow>

                  <Separator />

                  <div className="flex gap-2">
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

                    {updateStatus === "downloaded" && (
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        onClick={handleInstallUpdate}
                      >
                        <IconDownload className="size-3.5 mr-1.5" />
                        Install & Restart
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "about" && (
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <IconInfoCircle className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">About</h2>
                    <p className="text-xs text-muted-foreground">Application information</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">{pkg.productName}</p>
                      <p className="text-xs text-muted-foreground">v{pkg.version}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pkg.description}
                  </p>
                 </div>
                 <div className="mt-6 text-center text-[11px] text-muted-foreground space-y-0.5">
                   <p>QuickPrompt &copy; {new Date().getFullYear()}</p>
                   <p>Built by Muhammad Bilal Hassan</p>
                 </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
