# Phase 4 — Vault Encryption (safeStorage → keyring + AES-GCM)

**Goal:** replace Electron `safeStorage` with a cross-platform Rust equivalent. Highest-risk phase — get this right before touching user vault data.

## Inputs

- `electron/database/vault.js` — `safeStorage.encryptString` / `decryptString`.
- `electron/backup.js` — passphrase encryption for backups.
- `electron/main.js` — `backup:set-passphrase`, `backup:has-passphrase`.

## Design

1. Master key: generate a random 32-byte key on first run, store it in the OS credential store via the `keyring` crate (Windows Credential Manager / macOS Keychain / Linux Secret Service).
2. Item payloads: AES-256-GCM (crate `aes-gcm`). Store `base64(nonce ‖ ciphertext)` in the same columns the Electron app used.
3. Never log or return plaintext; decrypt only inside the command.

## Data migration (the hard part)

Electron `safeStorage` is **not** decryptable from Rust:
- Windows: DPAPI tied to the Electron process/user scope.
- macOS: Keychain item created by Electron.

Do **one** of these, decided before writing code:

- **A — Clean break (recommended for v1):** Tauri app uses its own key + new encryption. Existing users move data with the app's own encrypted backup: old Electron app → *Export backup* → Tauri app → *Restore*. No cross-tool decryption needed.
- **B — In-place decrypt shim:** ship a one-time helper that runs under Electron to re-encrypt vault rows into the new scheme, then the Tauri app takes over. More work, seamless if it works.

Pick A unless there is a hard requirement for in-place upgrade.

## Steps

1. Add `keyring`, `aes-gcm`, `rand`, `base64`.
2. `src-tauri/src/crypto.rs`: `encrypt(plaintext) -> String`, `decrypt(&str) -> Result<String>`.
3. Wire into vault create/update/get and vault copy.
4. Reuse the same scheme (argon2 or PBKDF2 + AES-GCM) for backup passphrases in Phase 5.
5. Add a round-trip unit test: encrypt → decrypt → equal, and tamper → error.

## Done when

- [ ] Vault create/get/update round-trips with encryption at rest.
- [ ] DB inspection shows no plaintext secrets.
- [ ] Tampered ciphertext fails cleanly, no panic.
- [ ] Migration path A or B documented and tested once.

## Risks

- Losing the master key = losing every vault item. Add a "recover by passphrase" export before shipping.
- Linux Secret Service may be unavailable on headless/minimal desktops — fall back to a passphrase-derived key with a clear warning.
