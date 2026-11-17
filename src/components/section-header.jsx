/**
 * Small section label with a count pill and an optional trailing action.
 * Used by the Collections and Vault list views.
 */
export function SectionHeader({ label, count, action, className }) {
  return (
    <div className={className ?? "mb-2 flex items-center justify-between gap-2"}>
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

export default SectionHeader
