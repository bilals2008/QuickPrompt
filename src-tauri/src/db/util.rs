//! Small helpers shared by the repository modules, mirroring the JS idioms they
//! replace (`new Date().toISOString()`, `crypto.randomUUID()`, value clamping).
use chrono::{SecondsFormat, Utc};

/// `2026-11-21T12:34:56.789Z` — the exact shape of `Date.prototype.toISOString`.
pub fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// `new Date(value)` is valid, i.e. the timestamp can be kept as-is.
pub fn is_iso_timestamp(value: &str) -> bool {
    chrono::DateTime::parse_from_rfc3339(value).is_ok()
}

/// `Math.max(1, Math.min(500, Math.floor(Number(limit) || 100)))`
pub fn page_limit(limit: Option<i64>) -> i64 {
    match limit {
        Some(value) if value != 0 => value.clamp(1, 500),
        _ => 100,
    }
}

/// `Math.max(0, Math.floor(Number(offset) || 0))`
pub fn page_offset(offset: Option<i64>) -> i64 {
    offset.unwrap_or(0).max(0)
}

/// Number of a `COUNT(*) AS count` row, `0` when the row is missing.
pub fn count_of(row: &Option<serde_json::Value>) -> i64 {
    row.as_ref()
        .and_then(|value| value.get("count"))
        .and_then(|value| value.as_i64())
        .unwrap_or(0)
}
