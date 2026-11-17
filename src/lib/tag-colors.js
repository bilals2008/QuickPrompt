export const TAG_COLORS = [
  "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400",
  "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
  "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
]

export const TAG_CLASS =
  "inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-medium border leading-tight"

export function getTagColor(tag) {
  const value = typeof tag === "string" ? tag : String(tag ?? "")
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}
