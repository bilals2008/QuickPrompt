# Build and verification

## Verify with the smallest command that proves the change

- Rust: `cargo build` or `cargo clippy` inside `src-tauri/`.
- Frontend: `npm test` or `npm run lint` at the root.
- Run the full set once, at the end — not after every edit.
- A change is not finished until it has been seen on a running app:
  `cargo tauri dev` (start `npm run dev` first — the Tauri config uses
  `http://localhost:5173` and does not launch Vite itself).

## Cargo discipline

- **Never run two cargo builds at the same time.** They fight over the target
  lock and `link.exe` fails with a bogus "build tools missing" error. Wait for
  one to finish before starting the next.
- After a small fix, re-run the targeted command — cargo reuses what is built.
  Do not start a fresh full build and do not `cargo clean` mid-task.
- `cargo tauri build` only when the packaged app must actually be driven. If
  the change does not touch what the binary uses, reuse the binary already in
  `src-tauri/target`.
- If `target/` is already huge, report its size and let the reader decide about
  a clean; never delete it unasked.
- Build scratch binaries and examples only when they are about to be used, and
  remove them when the task ends.
