import { useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  IconMoon,
  IconInfoCircle,
  IconPlayerPlay,
  IconCheck,
  IconSettings,
  IconMessage,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import pkg from "../../package.json"

const sections = [
  { id: "general", icon: IconPlayerPlay, label: "General" },
  { id: "appearance", icon: IconMoon, label: "Appearance" },
  { id: "about", icon: IconInfoCircle, label: "About" },
]

const themes = [
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
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState("appearance")

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/50 px-4">
        <IconSettings className="size-4 text-primary" />
        <h1 className="text-base font-bold tracking-tight text-primary">Settings</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-44 shrink-0 border-r border-border bg-card/30 p-3 flex flex-col gap-1">
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

        <ScrollArea className="flex-1">
          <div className="p-6">

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
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((t) => (
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
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Electron</p>
                      <p className="text-sm font-medium text-foreground">42</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">React</p>
                      <p className="text-sm font-medium text-foreground">19</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">SQLite</p>
                      <p className="text-sm font-medium text-foreground">3</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">shadcn/ui</p>
                      <p className="text-sm font-medium text-foreground">4</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-[11px] text-muted-foreground space-y-0.5">
                  <p>QuickPrompt &copy; {new Date().getFullYear()}</p>
                </div>
              </section>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
