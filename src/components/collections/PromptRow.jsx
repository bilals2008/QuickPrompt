import { useState } from "react"
import { cn } from "@/lib/utils"
import { getPromptTitle, getPromptBody } from "@/lib/prompt-utils"
import { parseTagsString } from "@/lib/tag-utils"
import { TAG_CLASS, getTagColor } from "@/lib/tag-colors"
import { IconCheck, IconCopy, IconStar, IconStarFilled, IconX } from "@tabler/icons-react"

function TagChips({ tags, max = 4 }) {
  const list = parseTagsString(tags)
  if (list.length === 0) return null
  const visible = list.slice(0, max)
  const hidden = list.length - visible.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <span key={tag} className={cn(TAG_CLASS, getTagColor(tag))}>
          {tag}
        </span>
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted px-1.5 py-[1px] text-[10px] font-medium leading-tight text-muted-foreground">
          +{hidden}
        </span>
      )}
    </div>
  )
}

/**
 * A single prompt inside a folder. Clicking the row copies the prompt,
 * matching the click-to-copy behavior used across the app.
 */
export function PromptRow({ prompt, onCopy, onRemove, onToggleFavorite }) {
  const [copied, setCopied] = useState(false)

  const title = getPromptTitle(prompt)
  const body = getPromptBody(prompt)
  const hasTags = parseTagsString(prompt.tags).length > 0

  const handleCopy = () => {
    onCopy(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div
      onClick={handleCopy}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card p-3 transition-all duration-150",
        "hover:border-border hover:bg-accent/30 hover:shadow-sm"
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className="mt-0.5 shrink-0 cursor-pointer rounded p-0.5 transition-colors hover:bg-amber-500/10"
        aria-label={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {prompt.favorite ? (
          <IconStarFilled size={14} className="text-amber-400" />
        ) : (
          <IconStar
            size={14}
            className="text-muted-foreground/30 transition-colors group-hover:text-muted-foreground"
          />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug text-foreground">
            {title}
          </p>

          <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              className={cn(
                "flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors",
                copied
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
              title={copied ? "Copied" : "Copy"}
              aria-label="Copy prompt"
            >
              {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
            </button>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Remove from folder"
                aria-label="Remove from folder"
              >
                <IconX size={13} />
              </button>
            )}
          </div>
        </div>

        {body && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
        )}

        {hasTags && (
          <div className="mt-2">
            <TagChips tags={prompt.tags} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PromptRow
