/**
 * Field definitions for each vault credential type.
 *
 * `key` is dot-pathed:
 *   - "value"     → the encrypted secret column
 *   - "notes"     → the notes column
 *   - "meta.<x>"  → a small JSON blob of type-specific extras (username, expiry, …)
 */
export const VAULT_TYPE_FIELDS = {
  api_key: [
    { key: "value", label: "API Key", placeholder: "sk-...", secret: true, required: true },
    { key: "meta.keyId", label: "Key ID", placeholder: "Optional — project or key label" },
    { key: "notes", label: "Notes", placeholder: "Optional — scope, usage...", multiline: true },
  ],
  password: [
    { key: "meta.username", label: "Username", placeholder: "you@example.com" },
    { key: "value", label: "Password", placeholder: "Enter password", secret: true, required: true },
    { key: "notes", label: "Notes", placeholder: "Optional — security questions, hints...", multiline: true },
  ],
  token: [
    { key: "value", label: "Token", placeholder: "eyJhbGciOi...", secret: true, required: true },
    { key: "meta.expires", label: "Expires", placeholder: "Optional — e.g. 2026-12-31" },
    { key: "notes", label: "Notes", placeholder: "Optional — scopes, issuer...", multiline: true },
  ],
  card: [
    { key: "value", label: "Card number", placeholder: "4242 4242 4242 4242", secret: true, required: true },
    { key: "meta.holder", label: "Cardholder", placeholder: "Name on card" },
    { key: "meta.expiry", label: "Expiry", placeholder: "MM/YY" },
    { key: "meta.cvc", label: "CVC", placeholder: "123", secret: true },
    { key: "notes", label: "Notes", placeholder: "Optional — billing address, bank...", multiline: true },
  ],
  note: [
    { key: "notes", label: "Note", placeholder: "Write your note...", multiline: true, required: true },
  ],
}

export function getVaultTypeFields(type) {
  return VAULT_TYPE_FIELDS[type] || VAULT_TYPE_FIELDS.note
}

/** Reads a dot-pathed field key out of the dialog form state. */
export function readVaultField(form, key) {
  if (key === "value") return form.value || ""
  if (key === "notes") return form.notes || ""
  if (key.startsWith("meta.")) return form.meta?.[key.slice(5)] || ""
  return ""
}

/** Returns a new form with a dot-pathed field key updated. */
export function writeVaultField(form, key, value) {
  if (key === "value") return { ...form, value }
  if (key === "notes") return { ...form, notes: value }
  if (key.startsWith("meta.")) {
    return { ...form, meta: { ...form.meta, [key.slice(5)]: value } }
  }
  return form
}

/** Last 4 digits of a card number, used for the masked list preview. */
export function cardLast4(value) {
  const digits = String(value || "").replace(/\D/g, "")
  return digits.length >= 4 ? digits.slice(-4) : ""
}

/**
 * Display-only masking for a secret. Never call this on a value that is about
 * to be written back — it is for rendering, not storage.
 */
export function maskValue(value, type) {
  const raw = value || ""
  if (!raw) return "Empty"
  if (type === "password" || type === "card") return "••••••••••••"
  if (raw.length <= 8) return "•".repeat(raw.length)
  return `${raw.slice(0, 4)}${"•".repeat(8)}${raw.slice(-4)}`
}
