//! Vault folders, ported from electron/database/vault-folders.js.
use rusqlite::Connection;
use serde::Deserialize;
use serde_json::{json, Value};

use super::vault::map_row;
use crate::db::rows::{self, int, opt_text, text, SqlValue};
use crate::db::util::{count_of, new_id, now_iso};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewVaultFolder {
    pub name: String,
    #[serde(default)]
    pub parent_id: Option<String>,
    #[serde(default = "default_icon")]
    pub icon: String,
    #[serde(default)]
    pub color: String,
    #[serde(default)]
    pub appearance: String,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateVaultFolder {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub appearance: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct FolderItemOptions {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort_order: String,
}

fn default_icon() -> String {
    "folder".to_string()
}

fn next_sort_order(conn: &Connection, parent_id: &Option<String>) -> Result<i64, String> {
    let row = rows::one(
        conn,
        "SELECT MAX(sort_order) AS max_order FROM vault_folders WHERE parent_id IS ?",
        &[opt_text(parent_id.clone())],
    )?;
    let max = row
        .as_ref()
        .and_then(|value| value.get("max_order"))
        .and_then(Value::as_i64);
    Ok(max.unwrap_or(-1) + 1)
}

fn max_link_order(conn: &Connection, folder_id: &str) -> Result<i64, String> {
    let row = rows::one(
        conn,
        "SELECT MAX(sort_order) AS max_order FROM vault_item_folders WHERE folder_id = ?",
        &[text(folder_id)],
    )?;
    let max = row
        .as_ref()
        .and_then(|value| value.get("max_order"))
        .and_then(Value::as_i64);
    Ok(max.unwrap_or(-1) + 1)
}

pub fn create(conn: &Connection, data: NewVaultFolder) -> Result<Value, String> {
    let id = new_id();
    let now = now_iso();
    let sort_order = next_sort_order(conn, &data.parent_id)?;
    rows::execute(
        conn,
        "INSERT INTO vault_folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at, appearance) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            text(&id),
            text(data.name.trim().to_string()),
            opt_text(data.parent_id),
            text(data.icon),
            text(data.color),
            int(sort_order),
            text(&now),
            text(now),
            text(data.appearance),
        ],
    )?;
    find(conn, &id)?.ok_or_else(|| "Vault folder not found after insert".to_string())
}

pub fn find(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    rows::one(conn, "SELECT * FROM vault_folders WHERE id = ?", &[text(id)])
}

pub fn get_all(conn: &Connection) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT * FROM vault_folders ORDER BY sort_order ASC, name ASC",
        &[],
    )
}

pub fn roots(conn: &Connection) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT * FROM vault_folders WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC",
        &[],
    )
}

pub fn children(conn: &Connection, parent_id: &str) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT * FROM vault_folders WHERE parent_id = ? ORDER BY sort_order ASC, name ASC",
        &[text(parent_id)],
    )
}

pub fn rename(conn: &Connection, id: &str, name: &str) -> Result<Option<Value>, String> {
    rows::execute(
        conn,
        "UPDATE vault_folders SET name = ?, updated_at = ? WHERE id = ?",
        &[text(name.trim().to_string()), text(now_iso()), text(id)],
    )?;
    find(conn, id)
}

pub fn update(
    conn: &Connection,
    id: &str,
    data: UpdateVaultFolder,
) -> Result<Option<Value>, String> {
    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<SqlValue> = Vec::new();

    if let Some(name) = data.name {
        sets.push("name = ?");
        params.push(text(name.trim().to_string()));
    }
    if let Some(icon) = data.icon {
        sets.push("icon = ?");
        params.push(text(icon));
    }
    if let Some(color) = data.color {
        sets.push("color = ?");
        params.push(text(color));
    }
    if let Some(appearance) = data.appearance {
        sets.push("appearance = ?");
        params.push(text(appearance));
    }

    if sets.is_empty() {
        return find(conn, id);
    }

    sets.push("updated_at = ?");
    params.push(text(now_iso()));
    params.push(text(id));

    rows::execute(
        conn,
        &format!("UPDATE vault_folders SET {} WHERE id = ?", sets.join(", ")),
        &params,
    )?;
    find(conn, id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM vault_item_folders WHERE folder_id = ?",
        &[text(id)],
    )?;
    rows::execute(conn, "DELETE FROM vault_folders WHERE id = ?", &[text(id)])?;
    Ok(json!({ "success": true }))
}

pub fn breadcrumb(conn: &Connection, folder_id: &str) -> Result<Vec<Value>, String> {
    let mut chain: Vec<Value> = Vec::new();
    let mut current = find(conn, folder_id)?;
    while let Some(folder) = current {
        let parent_id = folder
            .get("parent_id")
            .and_then(Value::as_str)
            .map(str::to_owned);
        chain.insert(0, folder);
        match parent_id {
            Some(parent) => current = find(conn, &parent)?,
            None => break,
        }
    }
    Ok(chain)
}

pub fn add_item(conn: &Connection, vault_item_id: &str, folder_id: &str) -> Result<Value, String> {
    if let Some(existing) = rows::one(
        conn,
        "SELECT id FROM vault_item_folders WHERE vault_item_id = ? AND folder_id = ?",
        &[text(vault_item_id), text(folder_id)],
    )? {
        return Ok(existing);
    }
    let id = new_id();
    let sort_order = max_link_order(conn, folder_id)?;
    rows::execute(
        conn,
        "INSERT INTO vault_item_folders (id, vault_item_id, folder_id, sort_order, created_at) \
         VALUES (?, ?, ?, ?, ?)",
        &[
            text(&id),
            text(vault_item_id),
            text(folder_id),
            int(sort_order),
            text(now_iso()),
        ],
    )?;
    Ok(json!({ "id": id, "vaultItemId": vault_item_id, "folderId": folder_id }))
}

pub fn remove_item(
    conn: &Connection,
    vault_item_id: &str,
    folder_id: &str,
) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM vault_item_folders WHERE vault_item_id = ? AND folder_id = ?",
        &[text(vault_item_id), text(folder_id)],
    )?;
    Ok(json!({ "success": true }))
}

pub fn get_items(
    conn: &Connection,
    folder_id: &str,
    options: FolderItemOptions,
) -> Result<Value, String> {
    let total_row = rows::one(
        conn,
        "SELECT COUNT(*) AS count FROM vault_item_folders WHERE folder_id = ?",
        &[text(folder_id)],
    )?;

    let order_by = match options.sort_order.as_str() {
        "oldest" => "v.pinned DESC, v.favorite DESC, v.created_at ASC",
        "alpha" => "v.pinned DESC, v.favorite DESC, v.title COLLATE NOCASE ASC",
        "custom" => "v.pinned DESC, v.favorite DESC, vf.sort_order ASC, v.created_at DESC",
        _ => "v.pinned DESC, v.favorite DESC, v.created_at DESC",
    };

    let rows = rows::all(
        conn,
        &format!(
            "SELECT v.* FROM vault_items v \
             INNER JOIN vault_item_folders vf ON v.id = vf.vault_item_id \
             WHERE vf.folder_id = ? \
             ORDER BY {order_by} \
             LIMIT ? OFFSET ?"
        ),
        &[
            text(folder_id),
            int(options.limit.unwrap_or(200)),
            int(options.offset.unwrap_or(0)),
        ],
    )?;

    let items: Vec<Value> = rows.iter().map(map_row).collect();
    Ok(json!({ "items": items, "total": count_of(&total_row) }))
}

pub fn get_item_folders(conn: &Connection, vault_item_id: &str) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT f.* FROM vault_folders f \
         INNER JOIN vault_item_folders vf ON f.id = vf.folder_id \
         WHERE vf.vault_item_id = ? \
         ORDER BY f.name ASC",
        &[text(vault_item_id)],
    )
}

pub fn search(conn: &Connection, query: &str) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT * FROM vault_folders WHERE name LIKE ? ORDER BY name ASC",
        &[text(format!("%{query}%"))],
    )
}
