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

- [x] Vault create/get/update round-trips with encryption at rest.
- [x] DB inspection shows no plaintext secrets.
- [x] Tampered ciphertext fails cleanly, no panic.
- [x] Migration path A or B documented and tested once.

## Implementation notes

Landed as planned, with one deviation from the step list: no `rand` crate. The
master key comes from `Key::<Aes256Gcm>::generate()` and each nonce from
`Nonce::generate()`, both backed by `getrandom` through the `aead` feature, so
only `keyring`, `aes-gcm` and `base64` were added.

- `src-tauri/src/crypto.rs` owns the whole scheme as `VaultCipher`:
  `Ready(Box<Aes256Gcm>)` or `Unavailable`, loaded once in `setup` and managed
  as app state. The cipher is injected into `repo::vault` functions so unit
  tests use a fixed key and never touch the real credential store.
- Credential store: `keyring` 4.2 (default `v1` feature links the native store
  per platform; Windows uses `windows-native-keyring-store`), service
  `com.quickprompt.desktop`, account `vault-master-key`, value is the base64
  of the 32-byte key. Created on first `NoEntry`.
- Stored format is `base64(nonce ‖ ciphertext)` with the 12-byte nonce first;
  the GCM tag stays inside the sealed ciphertext. `is_encrypted` is 1 for every
  AES-GCM row and 0 for the fallback rows, matching the Electron column usage.
- No drift on the fallback: when the credential store is unavailable (headless
  Linux, missing Secret Service) `VaultCipher::Unavailable` keeps Electron's
  base64-with-`is_encrypted = 0` behaviour and `vault_health` reports
  `encryptionAvailable: false`, so the existing warning in `VaultPage.jsx` still
  shows. The app never panics on a missing key.
- Unreadable ciphertext (tampered, or a row encrypted under another key) is
  logged to stderr and returned as an empty string, matching Electron's
  `decryptValue` catch. `crypto::decrypt` itself still returns `Err`, which is
  what the tamper test asserts.
- Migration: **path A**. Electron `safeStorage` payloads are undecryptable from
  Rust, so restore travels through the app's own encrypted backup. Path B is not
  implemented.

Verified: `cargo test` (12 tests, incl. crypto round-trip, tamper/foreign-key
rejection and the fallback), `cargo clippy --all-targets` clean, `npm test`
(52 tests) and `npm run lint` clean. The vault repo tests now also assert that a
created item is stored with `is_encrypted = 1` and that the plaintext does not
appear in the `value` column.

## Risks

- Losing the master key = losing every vault item. Add a "recover by passphrase" export before shipping.
- Linux Secret Service may be unavailable on headless/minimal desktops — fall back to a passphrase-derived key with a clear warning.
