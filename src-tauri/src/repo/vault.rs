//! Vault items and attachments, ported from electron/database/vault.js.
//!
//! Payloads are sealed by `crate::crypto::VaultCipher` (Phase 4): AES-256-GCM
//! with the key from the OS credential store. Rows written by Electron's
//! `safeStorage` cannot be opened here; migration travels through the app's own
//! encrypted backup (path A in the phase plan).
use rusqlite::{Connection, OptionalExtension};
use serde::Deserialize;
use serde_json::{json, Map, Value};

use crate::crypto::VaultCipher;
use crate::db::rows::{self, int, text, SqlValue};
use crate::db::util::{new_id, now_iso};

#[derive(Deserialize)]
pub struct NewVaultItem {
    #[serde(default)]
    pub title: String,
    #[serde(default = "note_type", rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub value: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub meta: Option<Value>,
    #[serde(default)]
    pub tags: Option<Value>,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub color_bg: String,
    #[serde(default)]
    pub color_text: String,
}

impl Default for NewVaultItem {
    fn default() -> Self {
        Self {
            title: String::new(),
            kind: note_type(),
            value: String::new(),
            notes: String::new(),
            meta: None,
            tags: None,
            url: String::new(),
            color_bg: String::new(),
            color_text: String::new(),
        }
    }
}

#[derive(Deserialize, Default)]
pub struct UpdateVaultItem {
    pub title: Option<String>,
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub value: Option<String>,
    pub notes: Option<String>,
    pub meta: Option<Value>,
    pub tags: Option<Value>,
    pub url: Option<String>,
    pub color_bg: Option<String>,
    pub color_text: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct VaultListOptions {
    pub sort_order: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub search: String,
    pub tags: Option<Value>,
}

#[derive(Deserialize)]
pub struct OrderUpdate {
    pub id: String,
    pub sort_order: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewAttachment {
    pub vault_item_id: String,
    pub filename: String,
    #[serde(default)]
    pub mime_type: String,
    #[serde(default)]
    pub data: String,
}

fn note_type() -> String {
    "note".to_string()
}

fn parse_meta(raw: &str) -> Map<String, Value> {
    if raw.is_empty() {
        return Map::new();
    }
    match serde_json::from_str::<Value>(raw) {
        Ok(Value::Object(map)) => map,
        _ => Map::new(),
    }
}

fn serialize_meta(meta: Option<&Value>) -> String {
    match meta {
        None | Some(Value::Null) => String::new(),
        Some(Value::String(raw)) => {
            let parsed = parse_meta(raw);
            if parsed.is_empty() {
                String::new()
            } else {
                Value::Object(parsed).to_string()
            }
        }
        Some(Value::Object(map)) => {
            let mut clean = Map::new();
            for (key, value) in map {
                let text = match value {
                    Value::Null => continue,
                    Value::String(item) => {
                        if item.is_empty() {
                            continue;
                        }
                        item.clone()
                    }
                    Value::Number(item) => item.to_string(),
                    Value::Bool(item) => item.to_string(),
                    _ => continue,
                };
                clean.insert(key.clone(), Value::String(text));
            }
            if clean.is_empty() {
                String::new()
            } else {
                Value::Object(clean).to_string()
            }
        }
        Some(_) => String::new(),
    }
}

pub fn sanitize_tags(tags: Option<&Value>) -> Vec<String> {
    let lower = |value: &str| value.trim().to_lowercase();
    let list = match tags {
        Some(Value::String(raw)) => raw.split(',').map(lower).collect::<Vec<_>>(),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| lower(item.as_str().unwrap_or("")))
            .collect(),
        _ => Vec::new(),
    };
    list.into_iter().filter(|tag| !tag.is_empty()).collect()
}

/// Open one stored payload. Unreadable ciphertext reads as empty, matching
/// Electron's `decryptValue` catch, and is logged instead of panicking.
fn reveal_value(cipher: &VaultCipher, encoded: &str, was_encrypted: bool) -> String {
    match cipher.decrypt(encoded, was_encrypted) {
        Ok(value) => value,
        Err(err) => {
            eprintln!("[Vault] Could not open stored secret: {err}");
            String::new()
        }
    }
}

/// Same shape as Electron's `mapRow` — mixed snake_case keys plus `hasValue`.
pub fn map_row(row: &Value) -> Value {
    let text_of = |key: &str| row.get(key).and_then(Value::as_str).unwrap_or("");
    let tags = text_of("tags");
    let value = text_of("value");
    let tag_list: Vec<String> = tags
        .split(',')
        .map(|tag| tag.trim().to_lowercase())
        .filter(|tag| !tag.is_empty())
        .collect();

    json!({
        "id": text_of("id"),
        "title": text_of("title"),
        "type": text_of("type"),
        "notes": text_of("notes"),
        "meta": Value::Object(parse_meta(text_of("meta"))),
        "tags": tag_list,
        "url": text_of("url"),
        "favorite": row.get("favorite").and_then(Value::as_i64).unwrap_or(0) != 0,
        "pinned": row.get("pinned").and_then(Value::as_i64).unwrap_or(0) != 0,
        "sort_order": row.get("sort_order").cloned().unwrap_or_else(|| Value::from(0)),
        "color_bg": text_of("color_bg"),
        "color_text": text_of("color_text"),
        "hasValue": !value.is_empty(),
        "created_at": text_of("created_at"),
        "updated_at": text_of("updated_at"),
    })
}

pub fn create(conn: &Connection, cipher: &VaultCipher, data: NewVaultItem) -> Result<Value, String> {
    let id = new_id();
    let now = now_iso();
    let title = data.title.trim();
    let kind = if data.kind.is_empty() { note_type() } else { data.kind };
    let url = data.url.trim();
    let safe_meta = serialize_meta(data.meta.as_ref());
    let tags = sanitize_tags(data.tags.as_ref()).join(",");
    let (encoded, encrypted) = cipher.encrypt(&data.value)?;

    rows::execute(
        conn,
        "INSERT INTO vault_items (id, title, type, value, is_encrypted, notes, meta, tags, url, \
         favorite, pinned, sort_order, color_bg, color_text, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)",
        &[
            text(&id),
            text(title),
            text(kind),
            text(encoded),
            int(if encrypted { 1 } else { 0 }),
            text(data.notes),
            text(safe_meta),
            text(tags),
            text(url),
            text(data.color_bg),
            text(data.color_text),
            text(&now),
            text(now),
        ],
    )?;

    get(conn, &id)?.ok_or_else(|| "Vault item not found after insert".to_string())
}

fn find_row(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    rows::one(conn, "SELECT * FROM vault_items WHERE id = ?", &[text(id)])
}

pub fn get(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    Ok(find_row(conn, id)?.as_ref().map(map_row))
}

pub fn reveal(conn: &Connection, cipher: &VaultCipher, id: &str) -> Result<Option<Value>, String> {
    let Some(row) = find_row(conn, id)? else {
        return Ok(None);
    };
    let encoded = row.get("value").and_then(Value::as_str).unwrap_or("");
    let encrypted = row.get("is_encrypted").and_then(Value::as_i64).unwrap_or(0) == 1;
    let mut mapped = map_row(&row);
    if let Value::Object(ref mut map) = mapped {
        map.insert(
            "value".to_string(),
            Value::from(reveal_value(cipher, encoded, encrypted)),
        );
    }
    Ok(Some(mapped))
}

pub fn list(conn: &Connection, options: VaultListOptions) -> Result<Vec<Value>, String> {
    let mut conditions: Vec<String> = Vec::new();
    let mut params: Vec<SqlValue> = Vec::new();

    if !options.kind.is_empty() {
        conditions.push("type = ?".to_string());
        params.push(text(options.kind));
    }

    let search = options.search.trim();
    if !search.is_empty() {
        conditions.push("(title LIKE ? OR notes LIKE ? OR tags LIKE ?)".to_string());
        let pattern = format!("%{search}%");
        params.push(text(pattern.clone()));
        params.push(text(pattern.clone()));
        params.push(text(pattern));
    }

    let tags = sanitize_tags(options.tags.as_ref());
    if !tags.is_empty() {
        conditions.push(format!(
            "({})",
            tags.iter().map(|_| "tags LIKE ?").collect::<Vec<_>>().join(" OR ")
        ));
        for tag in tags {
            params.push(text(format!("%{tag}%")));
        }
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let order_clause = match options.sort_order.as_str() {
        "oldest" => "ORDER BY pinned DESC, favorite DESC, created_at ASC",
        "alpha" => "ORDER BY pinned DESC, favorite DESC, title COLLATE NOCASE ASC",
        "custom" => "ORDER BY pinned DESC, favorite DESC, sort_order ASC, created_at DESC",
        _ => "ORDER BY pinned DESC, favorite DESC, created_at DESC",
    };

    let items = rows::all(
        conn,
        &format!("SELECT * FROM vault_items {where_clause} {order_clause}"),
        &params,
    )?;
    Ok(items.iter().map(map_row).collect())
}

pub fn update(
    conn: &Connection,
    cipher: &VaultCipher,
    id: &str,
    data: UpdateVaultItem,
) -> Result<Option<Value>, String> {
    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<SqlValue> = Vec::new();

    if let Some(title) = data.title {
        sets.push("title = ?");
        params.push(text(title.trim().to_string()));
    }
    if let Some(kind) = data.kind {
        sets.push("type = ?");
        params.push(text(if kind.is_empty() { note_type() } else { kind }));
    }
    if let Some(notes) = data.notes {
        sets.push("notes = ?");
        params.push(text(notes));
    }
    if data.meta.is_some() {
        sets.push("meta = ?");
        params.push(text(serialize_meta(data.meta.as_ref())));
    }
    if data.tags.is_some() {
        sets.push("tags = ?");
        params.push(text(sanitize_tags(data.tags.as_ref()).join(",")));
    }
    if let Some(url) = data.url {
        sets.push("url = ?");
        params.push(text(url.trim().to_string()));
    }
    if let Some(color_bg) = data.color_bg {
        sets.push("color_bg = ?");
        params.push(text(color_bg));
    }
    if let Some(color_text) = data.color_text {
        sets.push("color_text = ?");
        params.push(text(color_text));
    }
    if let Some(value) = data.value {
        let (encoded, encrypted) = cipher.encrypt(&value)?;
        sets.push("value = ?");
        params.push(text(encoded));
        sets.push("is_encrypted = ?");
        params.push(int(if encrypted { 1 } else { 0 }));
    }

    if sets.is_empty() {
        return get(conn, id);
    }

    sets.push("updated_at = ?");
    params.push(text(now_iso()));
    params.push(text(id));

    rows::execute(
        conn,
        &format!("UPDATE vault_items SET {} WHERE id = ?", sets.join(", ")),
        &params,
    )?;
    get(conn, id)
}

pub fn toggle_favorite(conn: &Connection, id: &str) -> Result<Value, String> {
    toggle_flag(conn, id, "favorite")
}

pub fn toggle_pin(conn: &Connection, id: &str) -> Result<Value, String> {
    toggle_flag(conn, id, "pinned")
}

fn toggle_flag(conn: &Connection, id: &str, column: &str) -> Result<Value, String> {
    let Some(row) = rows::one(
        conn,
        &format!("SELECT {column} FROM vault_items WHERE id = ?"),
        &[text(id)],
    )?
    else {
        return Ok(Value::Null);
    };
    let current = row.get(column).and_then(Value::as_i64).unwrap_or(0);
    let next = if current != 0 { 0 } else { 1 };
    rows::execute(
        conn,
        &format!("UPDATE vault_items SET {column} = ?, updated_at = ? WHERE id = ?"),
        &[int(next), text(now_iso()), text(id)],
    )?;
    get(conn, id).map(|row| row.unwrap_or(Value::Null))
}

pub fn update_order(conn: &Connection, updates: Vec<OrderUpdate>) -> Result<Value, String> {
    let tx = conn.unchecked_transaction().map_err(|err| err.to_string())?;
    let now = now_iso();
    for update in &updates {
        tx.execute(
            "UPDATE vault_items SET sort_order = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![update.sort_order, now, update.id],
        )
        .map_err(|err| err.to_string())?;
    }
    tx.commit().map_err(|err| err.to_string())?;
    Ok(json!({ "success": true }))
}

pub fn delete(conn: &Connection, id: &str) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM vault_attachments WHERE vault_item_id = ?",
        &[text(id)],
    )?;
    rows::execute(conn, "DELETE FROM vault_items WHERE id = ?", &[text(id)])?;
    Ok(json!({ "success": true }))
}

pub fn list_attachments(conn: &Connection, vault_item_id: &str) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT id, vault_item_id, filename, mime_type, size, created_at FROM vault_attachments \
         WHERE vault_item_id = ? ORDER BY created_at ASC",
        &[text(vault_item_id)],
    )
}

pub fn find_attachment(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    rows::one(
        conn,
        "SELECT id, vault_item_id, filename, mime_type, size, created_at FROM vault_attachments \
         WHERE id = ?",
        &[text(id)],
    )
}

pub fn create_attachment(
    conn: &Connection,
    cipher: &VaultCipher,
    data: NewAttachment,
) -> Result<Value, String> {
    let id = new_id();
    let now = now_iso();
    let filename = if data.filename.trim().is_empty() {
        "file".to_string()
    } else {
        data.filename.trim().to_string()
    };
    let size = data.data.len() as i64;
    let (encoded, encrypted) = cipher.encrypt(&data.data)?;

    conn.execute(
        "INSERT INTO vault_attachments (id, vault_item_id, filename, mime_type, size, data, is_encrypted, created_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        rusqlite::params![
            id,
            data.vault_item_id.trim(),
            filename,
            data.mime_type,
            size,
            encoded.as_bytes(),
            if encrypted { 1 } else { 0 },
            now,
        ],
    )
    .map_err(|err| err.to_string())?;

    find_attachment(conn, &id)?.ok_or_else(|| "Attachment not found after insert".to_string())
}

pub fn delete_attachment(conn: &Connection, id: &str) -> Result<bool, String> {
    if find_attachment(conn, id)?.is_none() {
        return Ok(false);
    }
    rows::execute(conn, "DELETE FROM vault_attachments WHERE id = ?", &[text(id)])?;
    Ok(true)
}

pub fn attachment_data(
    conn: &Connection,
    cipher: &VaultCipher,
    id: &str,
) -> Result<Option<Value>, String> {
    let row = conn
        .query_row(
            "SELECT id, vault_item_id, filename, mime_type, size, data, is_encrypted, created_at \
             FROM vault_attachments WHERE id = ?",
            rusqlite::params![id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, Vec<u8>>(5)?,
                    row.get::<_, i64>(6)?,
                    row.get::<_, Option<String>>(7)?,
                ))
            },
        )
        .optional()
        .map_err(|err| err.to_string())?;

    let Some((id, vault_item_id, filename, mime_type, size, blob, encrypted, created_at)) = row
    else {
        return Ok(None);
    };

    let encoded = String::from_utf8_lossy(&blob).into_owned();
    let data = reveal_value(cipher, &encoded, encrypted == 1);

    Ok(Some(json!({
        "id": id,
        "vault_item_id": vault_item_id,
        "filename": filename,
        "mime_type": mime_type,
        "size": size,
        "data": data,
        "created_at": created_at,
    })))
}
