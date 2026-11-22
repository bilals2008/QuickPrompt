//! Prompts and tags, ported from electron/database/prompts.js.
use rusqlite::Connection;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::db::rows::{self, int, text, SqlValue};
use crate::db::util::{count_of, is_iso_timestamp, new_id, now_iso, page_limit, page_offset};

#[derive(Deserialize)]
pub struct NewPrompt {
    pub content: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub tags: String,
    #[serde(default)]
    pub favorite: i64,
    /// Import passes the original timestamps through for a lossless round-trip.
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Deserialize, Default)]
pub struct UpdatePrompt {
    pub content: Option<String>,
    pub title: Option<String>,
    pub model: Option<String>,
    pub tags: Option<String>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct PaginatedOptions {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub search: String,
    pub favorites_only: bool,
    pub case_sensitive: bool,
    pub tags_only: bool,
    pub sort_order: String,
}

#[derive(Deserialize)]
pub struct OrderUpdate {
    pub id: String,
    pub sort_order: i64,
}

pub fn create(conn: &Connection, data: NewPrompt) -> Result<Value, String> {
    let id = new_id();
    let now = now_iso();
    let title = data.title.trim().to_string();
    let created_at = data
        .created_at
        .filter(|value| is_iso_timestamp(value))
        .unwrap_or_else(|| now.clone());
    let updated_at = data
        .updated_at
        .filter(|value| is_iso_timestamp(value))
        .unwrap_or_else(|| created_at.clone());

    rows::execute(
        conn,
        "INSERT INTO prompts (id, title, content, model, tags, favorite, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            text(&id),
            text(title),
            text(data.content),
            text(data.model),
            text(data.tags),
            int(data.favorite),
            text(created_at),
            text(updated_at),
        ],
    )?;

    find(conn, &id)?.ok_or_else(|| "Prompt not found after insert".to_string())
}

pub fn find(conn: &Connection, id: &str) -> Result<Option<Value>, String> {
    rows::one(conn, "SELECT * FROM prompts WHERE id = ?", &[text(id)])
}

pub fn get_all(conn: &Connection) -> Result<Vec<Value>, String> {
    rows::all(
        conn,
        "SELECT * FROM prompts ORDER BY favorite DESC, created_at DESC",
        &[],
    )
}

pub fn get_paginated(conn: &Connection, options: PaginatedOptions) -> Result<Value, String> {
    let mut conditions: Vec<String> = Vec::new();
    let mut params: Vec<SqlValue> = Vec::new();

    let search = options.search.trim();
    if !search.is_empty() {
        let operator = if options.case_sensitive { "GLOB" } else { "LIKE" };
        let pattern = if options.case_sensitive {
            format!("*{search}*")
        } else {
            format!("%{search}%")
        };
        if options.tags_only {
            conditions.push(format!("tags {operator} ?"));
            params.push(text(pattern));
        } else {
            conditions.push(format!(
                "(title {operator} ? OR content {operator} ? OR tags {operator} ?)"
            ));
            params.push(text(pattern.clone()));
            params.push(text(pattern.clone()));
            params.push(text(pattern));
        }
    }

    if options.favorites_only {
        conditions.push("favorite = 1".to_string());
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let order_clause = match options.sort_order.as_str() {
        "oldest" => "ORDER BY favorite DESC, created_at ASC",
        "alpha" => "ORDER BY favorite DESC, title ASC",
        "custom" => "ORDER BY favorite DESC, sort_order ASC, created_at DESC",
        _ => "ORDER BY favorite DESC, created_at DESC",
    };

    let total_row = rows::one(
        conn,
        &format!("SELECT COUNT(*) AS count FROM prompts {where_clause}"),
        &params,
    )?;

    let mut page_params = params;
    page_params.push(int(page_limit(options.limit)));
    page_params.push(int(page_offset(options.offset)));

    let prompts = rows::all(
        conn,
        &format!("SELECT * FROM prompts {where_clause} {order_clause} LIMIT ? OFFSET ?"),
        &page_params,
    )?;

    Ok(json!({ "prompts": prompts, "total": count_of(&total_row) }))
}

pub fn toggle_favorite(conn: &Connection, id: &str) -> Result<Value, String> {
    let Some(row) = rows::one(conn, "SELECT favorite FROM prompts WHERE id = ?", &[text(id)])?
    else {
        return Ok(Value::Null);
    };
    let favorite = row.get("favorite").and_then(Value::as_i64).unwrap_or(0);
    let next = if favorite != 0 { 0 } else { 1 };
    rows::execute(
        conn,
        "UPDATE prompts SET favorite = ?, updated_at = ? WHERE id = ?",
        &[int(next), text(now_iso()), text(id)],
    )?;
    find(conn, id).map(|row| row.unwrap_or(Value::Null))
}

pub fn update(conn: &Connection, id: &str, data: UpdatePrompt) -> Result<Option<Value>, String> {
    let mut sets: Vec<&str> = Vec::new();
    let mut params: Vec<SqlValue> = Vec::new();

    if let Some(content) = data.content {
        sets.push("content = ?");
        params.push(text(content));
    }
    if let Some(title) = data.title {
        sets.push("title = ?");
        params.push(text(title.trim().to_string()));
    }
    if let Some(model) = data.model {
        sets.push("model = ?");
        params.push(text(model));
    }
    if let Some(tags) = data.tags {
        sets.push("tags = ?");
        params.push(text(tags));
    }

    if sets.is_empty() {
        return find(conn, id);
    }

    sets.push("updated_at = ?");
    params.push(text(now_iso()));
    params.push(text(id));

    rows::execute(
        conn,
        &format!("UPDATE prompts SET {} WHERE id = ?", sets.join(", ")),
        &params,
    )?;
    find(conn, id)
}

pub fn delete(conn: &Connection, id: &str) -> Result<Value, String> {
    rows::execute(conn, "DELETE FROM prompts WHERE id = ?", &[text(id)])?;
    Ok(json!({ "success": true }))
}

pub fn get_all_tags(conn: &Connection) -> Result<Vec<Value>, String> {
    rows::all(conn, "SELECT * FROM tags ORDER BY name ASC", &[])
}

pub fn create_tag(conn: &Connection, name: &str) -> Result<Value, String> {
    let trimmed = name.trim().to_lowercase();
    if let Some(existing) = rows::one(conn, "SELECT * FROM tags WHERE name = ?", &[text(&trimmed)])? {
        return Ok(existing);
    }
    let id = new_id();
    rows::execute(
        conn,
        "INSERT INTO tags (id, name) VALUES (?, ?)",
        &[text(&id), text(&trimmed)],
    )?;
    Ok(json!({ "id": id, "name": trimmed }))
}

pub fn search(conn: &Connection, query: &str) -> Result<Vec<Value>, String> {
    let pattern = format!("%{query}%");
    rows::all(
        conn,
        "SELECT * FROM prompts WHERE title LIKE ? OR content LIKE ? OR model LIKE ? OR tags LIKE ? \
         ORDER BY created_at DESC",
        &[text(&pattern), text(&pattern), text(&pattern), text(pattern)],
    )
}

pub fn update_order(conn: &Connection, updates: Vec<OrderUpdate>) -> Result<Value, String> {
    let tx = conn.unchecked_transaction().map_err(|err| err.to_string())?;
    let now = now_iso();
    for update in &updates {
        tx.execute(
            "UPDATE prompts SET sort_order = ?, updated_at = ? WHERE id = ?",
            rusqlite::params![update.sort_order, now, update.id],
        )
        .map_err(|err| err.to_string())?;
    }
    tx.commit().map_err(|err| err.to_string())?;
    Ok(json!({ "success": true }))
}
