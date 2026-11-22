// Mirrors the Electron `db:health` handler: `{ ready, error }`.
use serde::Serialize;
use tauri::State;

use crate::db::DbState;

#[derive(Serialize)]
pub struct DbHealth {
    ready: bool,
    error: Option<String>,
}

#[tauri::command]
pub fn db_health(state: State<'_, DbState>) -> DbHealth {
    DbHealth {
        ready: state.is_ready(),
        error: state.error(),
    }
}
