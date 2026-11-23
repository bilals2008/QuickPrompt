# Data and security

## IPC / port rules (historical, from the migration)

The old ground rules still describe the architecture:

1. Port one `window.*` API namespace end-to-end, then verify.
2. The DB stays at `{app_data_dir}/QuickPrompt/quickprompt.db` so existing user
   data opens unchanged.
3. No behaviour drift: return shapes, key casing and error messages must match
   what the React code expects.
4. A phase is done only when its checklist is green.

The UI reaches native features only through `api.*` (`src/lib/api/`). Never
call `window.*` native APIs directly from components — the ESLint rule
`no-restricted-syntax` in `eslint.config.mjs` enforces this.

## Vault and backups

- The vault is encrypted at rest with a keyring-backed master key and AES-GCM.
  It is the only irreversible data path: prove it with real data before any
  destructive operation.
- Backups are encrypted. A restore must preserve prompts, folders and vault
  items.
- Keep the user's DB untouched as a rollback; never delete user data.
