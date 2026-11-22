//! Encrypted backups, ported from `electron/backup.js`.
//!
//! The on-disk format is byte-for-byte the Electron one so backups written by
//! either shell restore in the other:
//!
//! ```text
//! "QPBK" | version u32 LE | salt 16 | iv 12 | auth tag 16 | ciphertext
//! ```
//!
//! Key = scrypt(passphrase, salt, N = 2^14, r = 8, p = 1) and the payload is
//! AES-256-GCM. Node appends the tag to the ciphertext, Electron's buffer writer
//! puts it before it, so this module reassembles that order both ways.
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use chrono::{SecondsFormat, Utc};
use rusqlite::Connection;

const MAGIC: &[u8; 4] = b"QPBK";
const VERSION: u32 = 1;
const SALT_LEN: usize = 16;
const IV_LEN: usize = 12;
const TAG_LEN: usize = 16;
const HEADER_LEN: usize = 4 + 4 + SALT_LEN + IV_LEN;
const KEY_LEN: usize = 32;
const SCRYPT_LOG_N: u8 = 14;
const TEMP_DB_NAME: &str = "__backup_temp__.db";

fn random_bytes(len: usize) -> Result<Vec<u8>, String> {
    let mut buf = vec![0u8; len];
    getrandom::fill(&mut buf).map_err(|err| err.to_string())?;
    Ok(buf)
}

fn derive_key(passphrase: &str, salt: &[u8]) -> Result<[u8; KEY_LEN], String> {
    let params = scrypt::Params::new(SCRYPT_LOG_N, 8, 1, KEY_LEN).map_err(|err| err.to_string())?;
    let mut key = [0u8; KEY_LEN];
    scrypt::scrypt(passphrase.as_bytes(), salt, &params, &mut key)
        .map_err(|err| err.to_string())?;
    Ok(key)
}

pub fn encrypt_buffer(data: &[u8], passphrase: &str) -> Result<Vec<u8>, String> {
    let salt = random_bytes(SALT_LEN)?;
    let iv = random_bytes(IV_LEN)?;
    let key = derive_key(passphrase, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|err| err.to_string())?;
    let nonce = Nonce::try_from(iv.as_slice()).map_err(|_| "Invalid nonce".to_string())?;
    let sealed = cipher
        .encrypt(&nonce, data)
        .map_err(|_| "Backup encryption failed".to_string())?;

    // aes-gcm appends the tag; the Electron header layout puts it first.
    let split = sealed.len() - TAG_LEN;
    let (ciphertext, tag) = sealed.split_at(split);

    let mut out = Vec::with_capacity(HEADER_LEN + TAG_LEN + ciphertext.len());
    out.extend_from_slice(MAGIC);
    out.extend_from_slice(&VERSION.to_le_bytes());
    out.extend_from_slice(&salt);
    out.extend_from_slice(&iv);
    out.extend_from_slice(tag);
    out.extend_from_slice(ciphertext);
    Ok(out)
}

pub fn decrypt_buffer(buf: &[u8], passphrase: &str) -> Result<Vec<u8>, String> {
    if buf.len() < HEADER_LEN + TAG_LEN + 16 {
        return Err("Backup file is too small or corrupted".to_string());
    }
    if &buf[0..4] != MAGIC {
        return Err("Invalid backup file format".to_string());
    }
    let version = u32::from_le_bytes([buf[4], buf[5], buf[6], buf[7]]);
    if version != VERSION {
        return Err(format!("Unsupported backup version: {version}"));
    }

    let salt = &buf[8..8 + SALT_LEN];
    let iv = &buf[8 + SALT_LEN..HEADER_LEN];
    let tag = &buf[HEADER_LEN..HEADER_LEN + TAG_LEN];
    let ciphertext = &buf[HEADER_LEN + TAG_LEN..];

    let key = derive_key(passphrase, salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|err| err.to_string())?;
    let nonce = Nonce::try_from(iv).map_err(|_| "Invalid nonce".to_string())?;

    let mut sealed = Vec::with_capacity(ciphertext.len() + TAG_LEN);
    sealed.extend_from_slice(ciphertext);
    sealed.extend_from_slice(tag);

    cipher
        .decrypt(&nonce, sealed.as_slice())
        .map_err(|_| "Backup could not be opened with this passphrase".to_string())
}

/// Snapshot the live database with `VACUUM INTO`, encrypt it, and write
/// `quickprompt-<stamp>.qpbak` into `backup_dir`. Returns the file path.
pub fn create(
    conn: &Connection,
    db_dir: &Path,
    backup_dir: &Path,
    passphrase: &str,
) -> Result<String, String> {
    let temp_path = db_dir.join(TEMP_DB_NAME);
    // A leftover snapshot from a crashed run would make VACUUM INTO fail.
    if temp_path.exists() {
        let _ = std::fs::remove_file(&temp_path);
    }

    let escaped = temp_path.to_string_lossy().replace('\'', "''");
    conn.execute_batch(&format!("VACUUM INTO '{escaped}'"))
        .map_err(|err| err.to_string())?;

    let result = (|| -> Result<String, String> {
        let data = std::fs::read(&temp_path).map_err(|err| err.to_string())?;
        let encrypted = encrypt_buffer(&data, passphrase)?;
        let stamp = Utc::now().format("%Y-%m-%d-%H-%M-%S").to_string();
        let dest = backup_dir.join(format!("quickprompt-{stamp}.qpbak"));
        std::fs::write(&dest, encrypted).map_err(|err| err.to_string())?;
        Ok(dest.to_string_lossy().into_owned())
    })();

    // Best-effort cleanup, like Electron's `finally`.
    let _ = std::fs::remove_file(&temp_path);
    result
}

/// Decrypt a backup and replace `db_path` with it. The new file is checked for
/// the SQLite header before anything is overwritten, and stale WAL sidecars are
/// removed so SQLite cannot replay an old log against the restored file.
pub fn restore(file: &Path, passphrase: &str, db_path: &Path) -> Result<(), String> {
    let buf = std::fs::read(file).map_err(|err| err.to_string())?;
    let decrypted = decrypt_buffer(&buf, passphrase)?;

    if !decrypted.starts_with(b"SQLite format 3") {
        return Err("Decrypted file is not a valid SQLite database".to_string());
    }

    std::fs::write(db_path, &decrypted).map_err(|err| err.to_string())?;
    for suffix in ["-wal", "-shm"] {
        let mut sidecar = db_path.as_os_str().to_owned();
        sidecar.push(suffix);
        let _ = std::fs::remove_file(PathBuf::from(sidecar));
    }
    Ok(())
}

/// Keep the newest `max_keep` backups in `dir`, deleting older ones.
pub fn cleanup_old(dir: &Path, max_keep: usize) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut files: Vec<(SystemTime, PathBuf)> = entries
        .flatten()
        .filter(|entry| entry.path().extension().is_some_and(|ext| ext == "qpbak"))
        .filter_map(|entry| {
            let modified = entry.metadata().ok()?.modified().ok()?;
            Some((modified, entry.path()))
        })
        .collect();
    files.sort_by_key(|entry| std::cmp::Reverse(entry.0));

    for (_, path) in files.into_iter().skip(max_keep) {
        let _ = std::fs::remove_file(path);
    }
}

/// `lastBackupTime` is stored by both shells as an ISO timestamp.
pub fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

#[cfg(test)]
mod tests {
    use super::{decrypt_buffer, encrypt_buffer, MAGIC};

    #[test]
    fn round_trips_through_the_electron_header_layout() {
        let data = b"SQLite format 3\0rest of a database".to_vec();
        let sealed = encrypt_buffer(&data, "correct horse").expect("encrypt");

        assert_eq!(&sealed[0..4], MAGIC);
        assert_eq!(&sealed[4..8], &1u32.to_le_bytes());
        // Salt and IV are random, so two backups of the same data differ.
        assert_ne!(sealed, encrypt_buffer(&data, "correct horse").expect("encrypt"));
        assert!(!sealed.windows(data.len()).any(|window| window == data));

        assert_eq!(decrypt_buffer(&sealed, "correct horse").expect("decrypt"), data);
    }

    #[test]
    fn rejects_a_wrong_passphrase_and_tampered_bytes() {
        let sealed = encrypt_buffer(b"a payload long enough to pass", "one").expect("encrypt");

        let wrong = decrypt_buffer(&sealed, "two").expect_err("wrong passphrase");
        assert!(wrong.contains("could not be opened"));

        let mut tampered = sealed.clone();
        let last = tampered.len() - 1;
        tampered[last] ^= 0xff;
        assert!(decrypt_buffer(&tampered, "one").is_err());
    }

    #[test]
    fn rejects_bad_headers_with_the_electron_messages() {
        let short = decrypt_buffer(&[0u8; 8], "pw").expect_err("too small");
        assert_eq!(short, "Backup file is too small or corrupted");

        let mut wrong_magic = encrypt_buffer(b"0123456789abcdefghij".as_slice(), "pw").expect("encrypt");
        wrong_magic[0] = b'X';
        assert_eq!(
            decrypt_buffer(&wrong_magic, "pw").expect_err("magic"),
            "Invalid backup file format"
        );

        let mut wrong_version = encrypt_buffer(b"0123456789abcdefghij".as_slice(), "pw").expect("encrypt");
        wrong_version[4..8].copy_from_slice(&9u32.to_le_bytes());
        assert_eq!(
            decrypt_buffer(&wrong_version, "pw").expect_err("version"),
            "Unsupported backup version: 9"
        );
    }
    #[test]
    fn backs_up_a_live_database_and_restores_it() {
        let dir = tempfile::tempdir().expect("temp dir");
        let live = dir.path().join("quickprompt.db");
        let conn = crate::db::open(&live).expect("open");

        conn.execute_batch("CREATE TABLE marker (value TEXT); INSERT INTO marker VALUES ('kept');")
            .expect("write marker");

        let backups = dir.path().join("backups");
        std::fs::create_dir_all(&backups).expect("backup dir");
        let created = super::create(&conn, dir.path(), &backups, "passphrase").expect("create");
        drop(conn);

        let restored_path = dir.path().join("restored.db");
        super::restore(std::path::Path::new(&created), "passphrase", &restored_path)
            .expect("restore");

        let restored = crate::db::open(&restored_path).expect("reopen");
        let value: String = restored
            .query_row("SELECT value FROM marker", [], |row| row.get(0))
            .expect("read marker");
        assert_eq!(value, "kept");
        drop(restored);

        // A failed restore must leave the existing file untouched.
        let before = std::fs::read(&restored_path).expect("read file");
        assert!(super::restore(std::path::Path::new(&created), "wrong", &restored_path).is_err());
        assert_eq!(std::fs::read(&restored_path).expect("read file"), before);

        // The snapshot file is cleaned up after a successful backup.
        assert!(!dir.path().join("__backup_temp__.db").exists());
    }
}
