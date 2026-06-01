import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getFormat } from "../lib"

const VARIANTS = {
  json: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  csv: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  markdown: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20",
}

export function FormatBadge({ formatId, className }) {
  const format = getFormat(formatId)
  if (!format) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-mono text-[10px] uppercase tracking-wider",
        VARIANTS[format.id] ?? "",
        className,
      )}
    >
      {format.label}
    </Badge>
  )
}
