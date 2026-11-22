//! SQL for the feature modules. Each module mirrors one Electron database file
//! and takes a borrowed connection, so commands stay thin wrappers.
pub mod folders;
pub mod prompts;
pub mod vault;
pub mod vault_folders;

#[cfg(test)]
mod tests;
