// Phase 2 checks for the rusqlite layer. Kept out of mod.rs so the lifecycle
// code stays readable; these run with `cargo test` inside src-tauri/.
use super::*;
use crate::db::schema;

fn temp_db() -> (tempfile::TempDir, std::path::PathBuf) {
    let dir = tempfile::tempdir().expect("temp dir");
    let path = dir.path().join("quickprompt.db");
    (dir, path)
}

fn table_names(conn: &Connection) -> Vec<String> {
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .expect("prepare");
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .expect("query");
    rows.map(|r| r.expect("row")).collect()
}

fn pragma_i64(conn: &Connection, pragma: &str) -> i64 {
    conn.query_row(&format!("PRAGMA {pragma}"), [], |row| row.get(0))
        .expect("pragma value")
}

fn pragma_text(conn: &Connection, pragma: &str) -> String {
    conn.query_row(&format!("PRAGMA {pragma}"), [], |row| row.get(0))
        .expect("pragma value")
}

#[test]
fn fresh_database_has_every_schema_table() {
    let (_dir, path) = temp_db();
    let conn = open(&path).expect("open fresh db");

    let mut expected: Vec<String> = schema::TABLES.iter().map(|t| t.to_string()).collect();
    expected.sort();
    assert_eq!(table_names(&conn), expected);
    assert_eq!(verify_integrity(&conn), Ok(()));
}

#[test]
fn durability_pragmas_match_the_electron_values() {
    let (_dir, path) = temp_db();
    let conn = open(&path).expect("open fresh db");

    assert_eq!(pragma_text(&conn, "journal_mode").to_lowercase(), "wal");
    // 2 = FULL
    assert_eq!(pragma_i64(&conn, "synchronous"), 2);
    assert_eq!(pragma_i64(&conn, "foreign_keys"), 1);
    assert_eq!(pragma_i64(&conn, "busy_timeout"), 5000);
    assert_eq!(pragma_i64(&conn, "journal_size_limit"), 67108864);
}

#[test]
fn migrated_columns_exist() {
    let (_dir, path) = temp_db();
    let conn = open(&path).expect("open fresh db");

    let mut stmt = conn.prepare("PRAGMA table_info(prompts)").expect("prepare");
    let columns: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .expect("query")
        .map(|r| r.expect("row"))
        .collect();

    for column in ["favorite", "updated_at", "title", "sort_order"] {
        assert!(columns.iter().any(|c| c == column), "missing {column}");
    }
}

#[test]
fn corrupt_file_returns_an_error_instead_of_panicking() {
    let (_dir, path) = temp_db();
    std::fs::write(&path, b"this is not a sqlite database at all").expect("write garbage");

    let result = open(&path);
    assert!(result.is_err(), "corrupt database should fail loudly");
}

#[test]
fn opens_a_copy_of_the_real_database() {
    // Checklist: a real Electron database must open with no schema errors.
    // Skipped where no Electron data directory exists (CI).
    let Some(appdata) = std::env::var_os("APPDATA") else {
        return;
    };
    let real = std::path::Path::new(&appdata)
        .join("QuickPrompt")
        .join("QuickPrompt")
        .join("quickprompt.db");
    if !real.exists() {
        return;
    }

    let (dir, path) = temp_db();
    std::fs::copy(&real, &path).expect("copy real db");
    // Copy the WAL sidecar too when present so committed frames come along.
    let wal = real.with_extension("db-wal");
    if wal.exists() {
        std::fs::copy(&wal, dir.path().join("quickprompt.db-wal")).expect("copy wal");
    }

    let conn = open(&path).expect("open real db copy");
    assert_eq!(verify_integrity(&conn), Ok(()));

    // A real database may still carry legacy tables this schema no longer
    // creates; every schema table must be present all the same.
    let tables = table_names(&conn);
    for table in schema::TABLES {
        assert!(tables.iter().any(|t| t == table), "missing table {table}");
    }

    let prompts: i64 = conn
        .query_row("SELECT COUNT(*) FROM prompts", [], |row| row.get(0))
        .expect("count prompts");
    assert!(prompts > 0, "real database copy should contain prompts");
}
