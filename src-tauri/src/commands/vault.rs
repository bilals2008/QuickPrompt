// Vault item and attachment commands (see electron/preload.js `vaultAPI`).
use serde_json::{json, Value};
use tauri::State;

use crate::crypto::VaultCipher;
use crate::db::DbState;
use crate::repo::vault as repo;

/// Same shape as Electron's `vault:health`. `encryptionAvailable` is true once
/// the master key is loaded from the OS credential store.
#[tauri::command]
pub fn vault_health(cipher: State<'_, VaultCipher>) -> Value {
    json!({ "ready": true, "encryptionAvailable": cipher.is_available() })
}

#[tauri::command]
pub fn vault_create(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    data: Option<repo::NewVaultItem>,
) -> Result<Value, String> {
    let data = data.unwrap_or_default();
    state.with_conn(|conn| repo::create(conn, &cipher, data))
}

#[tauri::command]
pub fn vault_list(
    state: State<'_, DbState>,
    options: Option<repo::VaultListOptions>,
) -> Result<Vec<Value>, String> {
    let options = options.unwrap_or_default();
    state.with_conn(|conn| repo::list(conn, options))
}

#[tauri::command]
pub fn vault_get(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    id: String,
) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::reveal(conn, &cipher, &id))
}

#[tauri::command]
pub fn vault_update(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    id: String,
    data: Option<repo::UpdateVaultItem>,
) -> Result<Option<Value>, String> {
    let data = data.unwrap_or_default();
    state.with_conn(|conn| repo::update(conn, &cipher, &id, data))
}

#[tauri::command]
pub fn vault_toggle_favorite(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::toggle_favorite(conn, &id))
}

#[tauri::command]
pub fn vault_toggle_pin(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::toggle_pin(conn, &id))
}

#[tauri::command]
pub fn vault_update_order(
    state: State<'_, DbState>,
    updates: Vec<repo::OrderUpdate>,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::update_order(conn, updates))
}

#[tauri::command]
pub fn vault_delete(state: State<'_, DbState>, id: String) -> Result<Value, String> {
    state.with_conn(|conn| repo::delete(conn, &id))
}

#[tauri::command]
pub fn vault_copy(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    id: String,
) -> Result<Value, String> {
    let item = state.with_conn(|conn| repo::reveal(conn, &cipher, &id))?;
    match item {
        Some(item) => {
            let value = item.get("value").and_then(Value::as_str).unwrap_or("");
            Ok(json!({ "success": true, "value": value }))
        }
        None => Ok(json!({ "success": false, "reason": "not-found" })),
    }
}

#[tauri::command]
pub fn vault_attachments_list(
    state: State<'_, DbState>,
    vault_item_id: String,
) -> Result<Vec<Value>, String> {
    state.with_conn(|conn| repo::list_attachments(conn, &vault_item_id))
}

#[tauri::command]
pub fn vault_attachments_create(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    data: repo::NewAttachment,
) -> Result<Value, String> {
    state.with_conn(|conn| repo::create_attachment(conn, &cipher, data))
}

#[tauri::command]
pub fn vault_attachments_delete(state: State<'_, DbState>, id: String) -> Result<bool, String> {
    state.with_conn(|conn| repo::delete_attachment(conn, &id))
}

#[tauri::command]
pub fn vault_attachments_download(
    state: State<'_, DbState>,
    cipher: State<'_, VaultCipher>,
    id: String,
) -> Result<Option<Value>, String> {
    state.with_conn(|conn| repo::attachment_data(conn, &cipher, &id))
}
