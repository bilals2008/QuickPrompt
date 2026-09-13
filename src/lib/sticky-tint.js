export const STICKY_TINTS = [
  "sticky-tint-yellow",
  "sticky-tint-green",
  "sticky-tint-blue",
  "sticky-tint-pink",
  "sticky-tint-purple",
  "sticky-tint-orange",
  "sticky-tint-teal",
  "sticky-tint-rose",
]

/** Deterministic sticky-note tint for a prompt or vault item. */
export function getStickyTint(source) {
  const text = typeof source === "string" ? source : ""
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return STICKY_TINTS[Math.abs(hash) % STICKY_TINTS.length]
}
