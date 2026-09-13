import { cn } from "@/lib/utils"


/**
 * Dashed empty-state block with an icon, title, hint and optional action.
 * Shared by the Collections and Vault list views.
 */
export function EmptyState({ icon: Icon, title, hint, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/30 px-4 py-12",
        className
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted/60">
          <Icon size={18} className="text-muted-foreground/60" />
        </div>
      )}
      <div className="text-center">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
