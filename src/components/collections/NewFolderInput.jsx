import { useEffect, useRef, useState } from "react"
import { FolderGlyph } from "@/components/collections/FolderGlyph"

/**
 * Inline "New Folder" input. Used at the root level and when creating a
 * subfolder inside an existing folder.
 */
export function NewFolderInput({
  icon = "folder",
  color = "",
  placeholder = "New Folder",
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(placeholder)
  const inputRef = useRef(null)
  const settledRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = () => {
    if (settledRef.current) return
    settledRef.current = true
    const trimmed = name.trim()
    if (trimmed) onSubmit?.(trimmed)
    else onCancel?.()
  }

  const cancel = () => {
    if (settledRef.current) return
    settledRef.current = true
    onCancel?.()
  }

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-dashed border-ring/40 bg-card/40 px-2.5 py-2">
      <FolderGlyph folder={{ icon, color }} size={18} />
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
        className="min-w-0 flex-1 border-b border-ring/40 bg-transparent px-1 py-0.5 text-xs outline-none focus:border-ring"
        aria-label="New folder name"
      />
    </div>
  )
}

export default NewFolderInput
