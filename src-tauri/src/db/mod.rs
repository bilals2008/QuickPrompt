// Database lifecycle, ported from electron/database/db.js.
//
// The connection lives in Tauri state behind a Mutex so later phases can borrow
// it from commands. Opening never panics: a failed init is recorded in the state
// and reported through `db:health`, matching the Electron app's dbReady/dbError.
pub mod rows;
pub mod schema;
pub mod util;

#[cfg(test)]
mod tests;

use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use rusqlite::Connection;
use tauri::{AppHandle, Manager, Runtime};

const DB_DIR: &str = "QuickPrompt";
const DB_FILE: &str = "quickprompt.db";

struct Inner {
    conn: Option<Connection>,
    error: Option<String>,
}

pub struct DbState {
    inner: Mutex<Inner>,
}

impl DbState {
    fn new(conn: Option<Connection>, error: Option<String>) -> Self {
        Self {
            inner: Mutex::new(Inner { conn, error }),
        }
    }

    /// Borrow the live connection. Commands in later phases use this; the error
    /// text is what the user sees when the database never opened.
    pub fn with_conn<T>(&self, f: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
        let guard = self.lock();
        match guard.conn.as_ref() {
            Some(conn) => f(conn),
            None => Err(guard
                .error
                .clone()
                .unwrap_or_else(|| "Database not initialized".to_string())),
        }
    }

    pub fn is_ready(&self) -> bool {
        self.lock().conn.is_some()
    }

    pub fn error(&self) -> Option<String> {
        self.lock().error.clone()
    }

    /// WAL checkpoint + `PRAGMA optimize`, then drop the handle. Ported from
    /// `closeDatabase`. Safe to call when init failed.
    pub fn close(&self) {
        let conn = self.lock().conn.take();
        let Some(conn) = conn else { return };
        if let Err(err) = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE)") {
            eprintln!("[DB] WAL checkpoint on close failed: {err}");
        }
        if let Err(err) = conn.query_row("PRAGMA optimize", [], |_| Ok(())) {
            eprintln!("[DB] PRAGMA optimize on close failed: {err}");
        }
        drop(conn);
    }

    fn lock(&self) -> MutexGuard<'_, Inner> {
        // A poisoned lock only means another thread panicked while holding it;
        // the connection itself is still usable.
        self.inner.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

/// Build the managed state. Called once from the Tauri setup hook.
pub fn initialize<R: Runtime>(app: &AppHandle<R>) -> DbState {
    match database_path(app).and_then(|path| open(&path)) {
        Ok(conn) => {
            println!("[DB] Database initialized");
            DbState::new(Some(conn), None)
        }
        Err(err) => {
            eprintln!("[DB] Database init failed: {err}");
            DbState::new(None, Some(err))
        }
    }
}

/// `{app_data_dir}/QuickPrompt`, created if needed. Shared by the database,
/// settings, backups and folder icons.
pub fn data_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?
        .join(DB_DIR);
    std::fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir)
}

/// `{app_data_dir}/QuickPrompt/quickprompt.db`, creating the directory if needed.
pub fn database_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join(DB_FILE))
}

/// Open a database file: durability pragmas first, then the integrity gate,
/// recovery, and finally the schema. Errors are strings because they travel
/// straight to the UI, like the Electron messages they replace.
pub fn open(path: &Path) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|err| format!("{}", err))?;

    // Durability settings must be applied before any DDL/DML.
    configure_pragmas(&conn).map_err(|err| err.to_string())?;

    if let Err(reason) = verify_integrity(&conn) {
        eprintln!("[DB] Integrity check failed on open: {reason}");
        let recovered = try_recover(&conn);
        if let Err(reason) = recovered {
            return Err(format!(
                "Database is corrupt and could not be auto-recovered: {reason}"
            ));
        }
        println!("[DB] Database recovered via WAL checkpoint");
    }

    schema::create_tables(&conn).map_err(|err| err.to_string())?;
    Ok(conn)
}

fn configure_pragmas(conn: &Connection) -> rusqlite::Result<()> {
    // WAL keeps committed writes in a replayable sidecar file.
    conn.pragma_update(None, "journal_mode", "WAL")?;
    // FULL fsyncs on every commit, so a commit survives a power loss.
    conn.pragma_update(None, "synchronous", "FULL")?;
    // Extra macOS barrier; a no-op elsewhere.
    conn.pragma_update(None, "fullfsync", "ON")?;
    // Wait for a briefly-held write lock instead of failing with SQLITE_BUSY.
    conn.pragma_update(None, "busy_timeout", 5000)?;
    // Cap WAL growth between checkpoints.
    conn.pragma_update(None, "journal_size_limit", 67108864)?;
    // SQLite leaves foreign keys off by default; keep them on.
    conn.pragma_update(None, "foreign_keys", "ON")?;
    Ok(())
}

fn verify_integrity(conn: &Connection) -> Result<(), String> {
    match conn.query_row("PRAGMA integrity_check(1)", [], |row| row.get::<_, String>(0)) {
        Ok(result) if result == "ok" => Ok(()),
        Ok(result) if result.is_empty() => Err("integrity_check returned no result".to_string()),
        Ok(result) => Err(result),
        Err(err) => Err(err.to_string()),
    }
}

fn try_recover(conn: &Connection) -> Result<(), String> {
    // Best-effort: fold the WAL back into the main file, then re-check.
    let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE)");
    verify_integrity(conn)
}
