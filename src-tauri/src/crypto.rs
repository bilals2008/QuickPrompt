//! Vault payload encryption (Phase 4).
//!
//! One random 256-bit master key lives in the OS credential store (Windows
//! Credential Manager / macOS Keychain / Linux Secret Service). Every secret is
//! sealed with AES-256-GCM and stored as `base64(nonce ‖ ciphertext ‖ tag)` in
//! the same `value` column the Electron build used.
//!
//! Electron's `safeStorage` ciphertext is scoped to the Electron app (DPAPI,
//! Keychain item), so it cannot be opened from Rust. Existing users move their
//! data with the app's own encrypted backup — migration path A in
//! `docs/migration/phase-4-vault-encryption.md`.

use aes_gcm::aead::{Aead, Generate, Key, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use keyring::Entry;

const SERVICE: &str = "com.quickprompt.desktop";
const ACCOUNT: &str = "vault-master-key";
const KEY_LEN: usize = 32;
const NONCE_LEN: usize = 12;

/// Process-wide encryption state: either a loaded cipher or the same
/// "encryption unavailable" state Electron reports when `safeStorage` is
/// missing. The latter keeps the Electron fallback (base64, `is_encrypted = 0`)
/// so the app still runs, and the UI shows its existing warning.
pub enum VaultCipher {
    Ready(Box<Aes256Gcm>),
    Unavailable,
}

impl VaultCipher {
    pub fn from_key_bytes(bytes: &[u8]) -> Result<Self, String> {
        if bytes.len() != KEY_LEN {
            return Err(format!(
                "Vault master key must be {KEY_LEN} bytes, got {}",
                bytes.len()
            ));
        }
        Aes256Gcm::new_from_slice(bytes)
            .map(|cipher| Self::Ready(Box::new(cipher)))
            .map_err(|err| err.to_string())
    }

    /// Read the master key from the credential store, creating it on first run.
    /// Any failure leaves the cipher unavailable instead of panicking: a headless
    /// Linux box without a Secret Service still opens the app and warns.
    pub fn load() -> Self {
        match load_or_create_key() {
            Ok(bytes) => match Self::from_key_bytes(&bytes) {
                Ok(cipher) => {
                    println!("[Vault] Master key loaded from the credential store");
                    cipher
                }
                Err(err) => {
                    eprintln!("[Vault] Stored master key is unusable: {err}");
                    Self::Unavailable
                }
            },
            Err(err) => {
                eprintln!("[Vault] Credential store unavailable: {err}");
                Self::Unavailable
            }
        }
    }

    pub fn is_available(&self) -> bool {
        matches!(self, Self::Ready(_))
    }

    /// Seal a value. Returns the stored string plus the `is_encrypted` flag.
    pub fn encrypt(&self, plain: &str) -> Result<(String, bool), String> {
        match self {
            Self::Unavailable => Ok((STANDARD.encode(plain.as_bytes()), false)),
            Self::Ready(cipher) => {
                let nonce = Nonce::generate();
                let sealed = cipher
                    .encrypt(&nonce, plain.as_bytes())
                    .map_err(|_| "Vault encryption failed".to_string())?;
                let mut payload = Vec::with_capacity(NONCE_LEN + sealed.len());
                payload.extend_from_slice(nonce.as_slice());
                payload.extend_from_slice(&sealed);
                Ok((STANDARD.encode(payload), true))
            }
        }
    }

    /// Open a stored value. Plain base64 rows (written while encryption was
    /// unavailable) stay readable; tampered or foreign ciphertext is an error.
    pub fn decrypt(&self, encoded: &str, was_encrypted: bool) -> Result<String, String> {
        if encoded.is_empty() {
            return Ok(String::new());
        }
        let bytes = STANDARD
            .decode(encoded)
            .map_err(|_| "Stored secret is not valid base64".to_string())?;
        if !was_encrypted {
            return Ok(String::from_utf8_lossy(&bytes).into_owned());
        }
        let Self::Ready(cipher) = self else {
            return Err("Vault encryption is unavailable".to_string());
        };
        if bytes.len() <= NONCE_LEN {
            return Err("Stored secret is too short to be ciphertext".to_string());
        }
        let nonce = Nonce::try_from(&bytes[..NONCE_LEN])
            .map_err(|_| "Stored secret has an invalid nonce".to_string())?;
        let plain = cipher
            .decrypt(&nonce, &bytes[NONCE_LEN..])
            .map_err(|_| "Stored secret could not be decrypted".to_string())?;
        Ok(String::from_utf8_lossy(&plain).into_owned())
    }
}

fn load_or_create_key() -> Result<Vec<u8>, String> {
    let entry = Entry::new(SERVICE, ACCOUNT).map_err(|err| err.to_string())?;
    match entry.get_password() {
        Ok(stored) => {
            let bytes = STANDARD
                .decode(stored.trim())
                .map_err(|err| err.to_string())?;
            if bytes.len() != KEY_LEN {
                return Err(format!(
                    "Stored master key has {} bytes, expected {KEY_LEN}",
                    bytes.len()
                ));
            }
            Ok(bytes)
        }
        Err(keyring::Error::NoEntry) => {
            let key = Key::<Aes256Gcm>::generate();
            entry
                .set_password(&STANDARD.encode(key.as_slice()))
                .map_err(|err| err.to_string())?;
            Ok(key.as_slice().to_vec())
        }
        Err(err) => Err(err.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::VaultCipher;
    use base64::Engine;

    fn cipher() -> VaultCipher {
        VaultCipher::from_key_bytes(&[9u8; 32]).expect("test key")
    }

    #[test]
    fn round_trips_and_marks_ciphertext() {
        let cipher = cipher();
        let (sealed, encrypted) = cipher.encrypt("super-secret").expect("encrypt");
        assert!(encrypted);
        assert!(!sealed.contains("super-secret"));
        assert_eq!(
            cipher.decrypt(&sealed, true).expect("decrypt"),
            "super-secret"
        );
    }

    #[test]
    fn tampered_ciphertext_fails_without_panicking() {
        let cipher = cipher();
        let (sealed, _) = cipher.encrypt("secret").expect("encrypt");
        let mut bytes = base64::engine::general_purpose::STANDARD
            .decode(&sealed)
            .expect("base64");
        let last = bytes.len() - 1;
        bytes[last] ^= 0xff;
        let tampered = base64::engine::general_purpose::STANDARD.encode(bytes);
        assert!(cipher.decrypt(&tampered, true).is_err());

        // A different key must not open it either.
        let other = VaultCipher::from_key_bytes(&[1u8; 32]).expect("other key");
        assert!(other.decrypt(&sealed, true).is_err());
    }

    #[test]
    fn unavailable_matches_the_electron_fallback() {
        let cipher = VaultCipher::Unavailable;
        let (stored, encrypted) = cipher.encrypt("plain").expect("fallback");
        assert!(!encrypted);
        assert_eq!(stored, "cGxhaW4=");
        assert_eq!(cipher.decrypt(&stored, false).expect("decode"), "plain");
        assert!(cipher.decrypt(&stored, true).is_err());
    }
}
