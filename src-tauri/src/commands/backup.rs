// Backup commands (see electron/preload.js `backupAPI` and `electron/backup.js`).
use serde_json::{json, Value};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::backup;
use crate::crypto::VaultCipher;
use crate::db::{self, DbState};
use crate::settings::SettingsStore;

const PASSPHRASE_KEY: &str = "backupPassphraseEncrypted";

#[tauri::command]
pub async fn backup_create(
    app: AppHandle,
    db_state: State<'_, DbState>,
    settings: State<'_, SettingsStore>,
    cipher: State<'_, VaultCipher>,
) -> Result<Value, String> {
    let backup_dir = settings
        .get("backupLocation", Some(Value::from("")))
        .as_str()
        .unwrap_or_default()
        .to_string();
    if backup_dir.is_empty() || !std::path::Path::new(&backup_dir).exists() {
        return Ok(json!({ "success": false, "reason": "backup-location-not-set" }));
    }
    let Some(passphrase) = read_passphrase(&settings, &cipher) else {
        return Ok(json!({ "success": false, "reason": "passphrase-not-set" }));
    };

    let db_dir = db::data_dir(&app)?;
    let created = db_state.with_conn(|conn| {
        backup::create(
            conn,
            &db_dir,
            std::path::Path::new(&backup_dir),
            &passphrase,
        )
    });

    match created {
        Ok(path) => {
            settings.set("lastBackupTime", Value::from(backup::now_iso()))?;
            let keep = settings
                .get("backupRetention", Some(Value::from(10)))
                .as_u64()
                .unwrap_or(10) as usize;
            backup::cleanup_old(std::path::Path::new(&backup_dir), keep);
            Ok(json!({ "success": true, "path": path }))
        }
        Err(err) => Ok(json!({ "success": false, "reason": err })),
    }
}

#[tauri::command]
pub async fn backup_restore(
    app: AppHandle,
    db_state: State<'_, DbState>,
    file_path: String,
    passphrase: Option<String>,
) -> Result<Value, String> {
    let db_path = db::database_path(&app)?;
    // The live connection must be gone before its file is replaced.
    db_state.close();

    match backup::restore(
        std::path::Path::new(&file_path),
        passphrase.as_deref().unwrap_or(""),
        &db_path,
    ) {
        Ok(()) => {
            // Let the response reach the UI before the process is replaced.
            let handle = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(150));
                handle.restart();
            });
            Ok(json!({ "success": true }))
        }
        Err(err) => Ok(json!({ "success": false, "reason": err })),
    }
}

#[tauri::command]
pub async fn backup_pick_file(app: AppHandle) -> Value {
    let picked = app
        .dialog()
        .file()
        .set_title("Select backup file")
        .add_filter("QuickPrompt Backup", &["qpbak"])
        .add_filter("All files", &["*"])
        .blocking_pick_file();

    match picked.and_then(|file| file.into_path().ok()) {
        Some(path) => json!({ "success": true, "path": path.to_string_lossy() }),
        None => json!({ "success": false }),
    }
}

#[tauri::command]
pub async fn backup_set_passphrase(
    settings: State<'_, SettingsStore>,
    cipher: State<'_, VaultCipher>,
    passphrase: Option<String>,
) -> Result<Value, String> {
    let Some(passphrase) = passphrase.filter(|value| !value.is_empty()) else {
        return Ok(json!({ "success": false, "reason": "invalid-passphrase" }));
    };
    if !cipher.is_available() {
        // Same answer Electron gives when safeStorage is missing: never write a
        // backup passphrase in the clear.
        return Ok(json!({ "success": false, "reason": "encryption-unavailable" }));
    }
    let (encoded, _) = cipher.encrypt(&passphrase)?;
    settings.set(PASSPHRASE_KEY, Value::from(format!("v1:{encoded}")))?;
    Ok(json!({ "success": true }))
}

#[tauri::command]
pub fn backup_has_passphrase(settings: State<'_, SettingsStore>) -> bool {
    settings.has_non_empty(PASSPHRASE_KEY)
}

/// Read and open the stored passphrase. The `v1:` / `b64:` prefix records how
/// the value was sealed, so a row written while encryption was unavailable
/// still opens.
fn read_passphrase(settings: &SettingsStore, cipher: &VaultCipher) -> Option<String> {
    let stored = settings
        .get(PASSPHRASE_KEY, Some(Value::from("")))
        .as_str()
        .unwrap_or_default()
        .to_string();
    if let Some(encoded) = stored.strip_prefix("v1:") {
        return cipher.decrypt(encoded, true).ok();
    }
    if let Some(encoded) = stored.strip_prefix("b64:") {
        return cipher.decrypt(encoded, false).ok();
    }
    None
}
