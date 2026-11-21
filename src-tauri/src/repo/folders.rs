//! Prompt folders, ported from electron/database/folders.js.
//!
//! Custom icons are stored as `qpicon://icon/<name>` like Electron; rows are
//! converted to the platform's served URL on the way out (see `crate::icons`).
use rusqlite::Connection;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::db::rows::{self, int, opt_text, text, SqlValue};
use crate::db::util::{count_of, new_id, now_iso};
use crate::icons;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewFolder {
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
pub struct UpdateFolder {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub appearance: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct FolderPromptOptions {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

fn default_icon() -> String {
    "folder".to_string()
}

fn next_sort_order(conn: &Connection, parent_id: &Option<String>) -> Result<i64, String> {
    let row = rows::one(
        conn,
        "SELECT MAX(sort_order) AS max_order FROM folders WHERE parent_id IS ?",
        &[opt_text(parent_id.clone())],
    )?;
    let max = row
        .as_ref()
        .and_then(|value| value.get("max_order"))
        .and_then(Value::as_i64);
    Ok(max.unwrap_or(-1) + 1)
}

pub fn create(conn: &Connection, data: NewFolder) -> Result<Value, String> {
    let id = new_id();
    let now = now_iso();
    let sort_order = next_sort_order(conn, &data.parent_id)?;
    rows::execute(
        conn,
        "INSERT INTO folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at, appearance) \
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
    find(conn, &id)?.ok_or_else(|| "Folder not found after insert".to_string())
}

fn map_folder(mut folder: Value) -> Value {
    if let Some(icon) = folder.get("icon").and_then(Value::as_str) {
        let display = icons::display_url(icon);
        if display != icon {
            if let Value::Object(ref mut map) = folder {
                map.insert("icon".to_string(), Value::from(display));
            }
        }
    }
    folder
}

fn map_folders(folders: Vec<Value>) -> Vec<Value> {
    folders.into_iter().map(map_folder).collect()
}

pub fn find(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    Ok(rows::one(conn, "SELECT * FROM folders WHERE id = ?", &[text(id)])?.map(map_folder))
}

/// The icon column exactly as stored, for comparing before and after an update.
pub fn stored_icon(conn: &Connection, id: &str) -> Result<Option<String>, String> {
    Ok(rows::one(
        conn,
        "SELECT icon FROM folders WHERE id = ?",
        &[text(id)],
    )?
    .and_then(|row| row.get("icon").and_then(Value::as_str).map(str::to_owned)))
}

pub fn get_all(conn: &Connection) -> Result<Vec<Value>, String> {
    let folders = rows::all(
        conn,
        "SELECT * FROM folders ORDER BY sort_order ASC, name ASC",
        &[],
    )?;
    Ok(map_folders(folders))
}

pub fn roots(conn: &Connection) -> Result<Vec<Value>, String> {
    let folders = rows::all(
        conn,
        "SELECT * FROM folders WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC",
        &[],
    )?;
    Ok(map_folders(folders))
}

pub fn children(conn: &Connection, parent_id: &str) -> Result<Vec<Value>, String> {
    let folders = rows::all(
        conn,
        "SELECT * FROM folders WHERE parent_id = ? ORDER BY sort_order ASC, name ASC",
        &[text(parent_id)],
    )?;
    Ok(map_folders(folders))
}

pub fn rename(conn: &Connection, id: &str, name: &str) -> Result<Option<Value>, String> {
    rows::execute(
        conn,
        "UPDATE folders SET name = ?, updated_at = ? WHERE id = ?",
        &[text(name.trim().to_string()), text(now_iso()), text(id)],
    )?;
    find(conn, id)
}

pub fn update(conn: &Connection, id: &str, data: UpdateFolder) -> Result<Option<Value>, String> {
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
        &format!("UPDATE folders SET {} WHERE id = ?", sets.join(", ")),
        &params,
    )?;
    find(conn, id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM prompt_folders WHERE folder_id = ?",
        &[text(id)],
    )?;
    rows::execute(conn, "DELETE FROM folders WHERE id = ?", &[text(id)])?;
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

pub fn add_prompt(conn: &Connection, prompt_id: &str, folder_id: &str) -> Result<Value, String> {
    if let Some(existing) = rows::one(
        conn,
        "SELECT id FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?",
        &[text(prompt_id), text(folder_id)],
    )? {
        return Ok(existing);
    }
    let id = new_id();
    let max = rows::one(
        conn,
        "SELECT MAX(sort_order) AS max_order FROM prompt_folders WHERE folder_id = ?",
        &[text(folder_id)],
    )?;
    let sort_order = max
        .as_ref()
        .and_then(|value| value.get("max_order"))
        .and_then(Value::as_i64)
        .unwrap_or(-1)
        + 1;
    rows::execute(
        conn,
        "INSERT INTO prompt_folders (id, prompt_id, folder_id, sort_order, created_at) \
         VALUES (?, ?, ?, ?, ?)",
        &[
            text(&id),
            text(prompt_id),
            text(folder_id),
            int(sort_order),
            text(now_iso()),
        ],
    )?;
    Ok(json!({ "id": id, "promptId": prompt_id, "folderId": folder_id }))
}

pub fn remove_prompt(conn: &Connection, prompt_id: &str, folder_id: &str) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?",
        &[text(prompt_id), text(folder_id)],
    )?;
    Ok(json!({ "success": true }))
}

pub fn move_prompt(
    conn: &Connection,
    prompt_id: &str,
    from_folder_id: &str,
    to_folder_id: &str,
) -> Result<Value, String> {
    rows::execute(
        conn,
        "DELETE FROM prompt_folders WHERE prompt_id = ? AND folder_id = ?",
        &[text(prompt_id), text(from_folder_id)],
    )?;
    let max = rows::one(
        conn,
        "SELECT MAX(sort_order) AS max_order FROM prompt_folders WHERE folder_id = ?",
        &[text(to_folder_id)],
    )?;
    let sort_order = max
        .as_ref()
        .and_then(|value| value.get("max_order"))
        .and_then(Value::as_i64)
        .unwrap_or(-1)
        + 1;
    rows::execute(
        conn,
        "INSERT INTO prompt_folders (id, prompt_id, folder_id, sort_order, created_at) \
         VALUES (?, ?, ?, ?, ?)",
        &[
            text(new_id()),
            text(prompt_id),
            text(to_folder_id),
            int(sort_order),
            text(now_iso()),
        ],
    )?;
    Ok(json!({ "success": true }))
}

pub fn get_prompts(
    conn: &Connection,
    folder_id: &str,
    options: FolderPromptOptions,
) -> Result<Value, String> {
    let total_row = rows::one(
        conn,
        "SELECT COUNT(*) AS count FROM prompt_folders WHERE folder_id = ?",
        &[text(folder_id)],
    )?;
    let prompts = rows::all(
        conn,
        "SELECT p.* FROM prompts p \
         INNER JOIN prompt_folders pf ON p.id = pf.prompt_id \
         WHERE pf.folder_id = ? \
         ORDER BY pf.sort_order ASC, p.created_at DESC \
         LIMIT ? OFFSET ?",
        &[
            text(folder_id),
            int(options.limit.unwrap_or(200)),
            int(options.offset.unwrap_or(0)),
        ],
    )?;
    Ok(json!({ "prompts": prompts, "total": count_of(&total_row) }))
}

pub fn get_prompt_folders(conn: &Connection, prompt_id: &str) -> Result<Vec<Value>, String> {
    let folders = rows::all(
        conn,
        "SELECT f.* FROM folders f \
         INNER JOIN prompt_folders pf ON f.id = pf.folder_id \
         WHERE pf.prompt_id = ? \
         ORDER BY f.name ASC",
        &[text(prompt_id)],
    )?;
    Ok(map_folders(folders))
}

pub fn search(conn: &Connection, query: &str) -> Result<Vec<Value>, String> {
    let folders = rows::all(
        conn,
        "SELECT * FROM folders WHERE name LIKE ? ORDER BY name ASC",
        &[text(format!("%{query}%"))],
    )?;
    Ok(map_folders(folders))
}
