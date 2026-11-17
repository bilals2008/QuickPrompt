import {
  IconLayoutGrid,
  IconList,
  IconLayoutRows,
  IconCheck,
  IconSortAscending,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const VIEWS = [
  { id: "grid", label: "Cards", hint: "Two columns of cards", icon: IconLayoutGrid },
  { id: "list", label: "List", hint: "Compact rows, dense", icon: IconList },
  { id: "spotlight", label: "Spotlight", hint: "One item, full detail", icon: IconLayoutRows },
]

export const VAULT_SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "alpha", label: "A–Z" },
  { id: "custom", label: "Manual order" },
]

export const VAULT_VIEW_MODES = VIEWS.map((v) => v.id)
export const VAULT_SORT_ORDERS = VAULT_SORT_OPTIONS.map((s) => s.id)

/**
 * Combined view + sort menu for the vault header. Mirrors the prompt grid/list
 * toggle, but offers a third full-detail mode for the narrow app window.
 */
export function VaultViewToggle({ view, sort, onViewChange, onSortChange }) {
  const active = VIEWS.find((v) => v.id === view) ?? VIEWS[0]
  const ActiveIcon = active.icon
  const activeSort = VAULT_SORT_OPTIONS.find((s) => s.id === sort) ?? VAULT_SORT_OPTIONS[0]

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border/40 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
              aria-label={`View: ${active.label}. Sort: ${activeSort.label}`}
            >
              <ActiveIcon size={14} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {active.label} · {activeSort.label}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          View
        </DropdownMenuLabel>
        {VIEWS.map((v) => {
          const Icon = v.icon
          const isActive = v.id === view
          return (
            <DropdownMenuItem key={v.id} onClick={() => onViewChange(v.id)} className="gap-2">
              <Icon size={14} className={isActive ? "text-foreground" : "text-muted-foreground"} />
              <span className="flex-1">{v.label}</span>
              {isActive && <IconCheck size={14} className="text-primary" />}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <IconSortAscending size={11} /> Sort
        </DropdownMenuLabel>
        {VAULT_SORT_OPTIONS.map((option) => {
          const isActive = option.id === sort
          return (
            <DropdownMenuItem key={option.id} onClick={() => onSortChange(option.id)} className="gap-2">
              <span className="flex-1">{option.label}</span>
              {isActive && <IconCheck size={14} className="text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
