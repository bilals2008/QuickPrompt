import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"

export function NavItem({ icon: Icon, label, active, onClick }) {
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
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

export function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2.5 sm:py-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-tight text-foreground">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SectionHeading({ icon: Icon, title, description }) {
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

export function SettingGroup({ title, children, className }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/80 bg-card", className)}>
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

export function ThemeCard({ theme, selected, onClick }) {
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
        <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
          <IconCheck size={12} className="text-primary-foreground" />
        </div>
      )}
      <div className="mb-3 h-16 w-full overflow-hidden rounded-lg border" style={{ borderColor: theme.card }}>
        <div className="h-full w-full p-2" style={{ background: theme.bg }}>
          <div className="mb-1.5 h-1.5 w-10 rounded-full" style={{ background: theme.accent }} />
          <div className="mb-2 h-1 w-16 rounded-full opacity-40" style={{ background: theme.text }} />
          <div className="flex gap-1">
            <div className="h-6 flex-1 rounded" style={{ background: theme.card }} />
            <div className="h-6 flex-1 rounded opacity-70" style={{ background: theme.card }} />
          </div>
        </div>
      </div>
      <p className="text-[13px] font-semibold text-foreground">{theme.label}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{theme.desc}</p>
    </button>
  )
}
