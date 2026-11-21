//! Row -> JSON conversion. The frontend receives plain objects from Electron's
//! sqlite3 driver, so rows are handed back as `serde_json::Value` with the
//! database's own snake_case column names — no struct reshaping, no drift.
use rusqlite::types::ValueRef;
use rusqlite::{params_from_iter, Connection, Row};
use serde_json::{Map, Value};

pub type SqlValue = rusqlite::types::Value;

pub fn text(value: impl Into<String>) -> SqlValue {
    SqlValue::Text(value.into())
}

pub fn int(value: i64) -> SqlValue {
    SqlValue::Integer(value)
}

/// `parent_id IS ?` needs a real NULL, not an empty string.
pub fn opt_text(value: Option<String>) -> SqlValue {
    value.map(SqlValue::Text).unwrap_or(SqlValue::Null)
}

fn column_to_json(value: ValueRef<'_>) -> Value {
    match value {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(v) => Value::from(v),
        ValueRef::Real(v) => serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number),
        ValueRef::Text(bytes) => Value::from(String::from_utf8_lossy(bytes).into_owned()),
        ValueRef::Blob(bytes) => Value::from(bytes),
    }
}

pub fn row_to_json(row: &Row<'_>) -> rusqlite::Result<Value> {
    let statement = row.as_ref();
    let mut map = Map::with_capacity(statement.column_count());
    for index in 0..statement.column_count() {
        let name = statement.column_name(index)?.to_owned();
        map.insert(name, column_to_json(row.get_ref(index)?));
    }
    Ok(Value::Object(map))
}

fn error(err: rusqlite::Error) -> String {
    err.to_string()
}

pub fn all(conn: &Connection, sql: &str, params: &[SqlValue]) -> Result<Vec<Value>, String> {
    let mut statement = conn.prepare(sql).map_err(error)?;
    let mut rows = statement
        .query(params_from_iter(params.iter()))
        .map_err(error)?;
    let mut items = Vec::new();
    while let Some(row) = rows.next().map_err(error)? {
        items.push(row_to_json(row).map_err(error)?);
    }
    Ok(items)
}

pub fn one(conn: &Connection, sql: &str, params: &[SqlValue]) -> Result<Option<Value>, String> {
    Ok(all(conn, sql, params)?.into_iter().next())
}

pub fn execute(conn: &Connection, sql: &str, params: &[SqlValue]) -> Result<usize, String> {
    conn.execute(sql, params_from_iter(params.iter()))
        .map_err(error)
}
