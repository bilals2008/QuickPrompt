// Tauri adapter. Tauri 2 injects `__TAURI_INTERNALS__` into every webview, so
// `invoke` works without the @tauri-apps/api package (still deliberately absent).
const invoke = (command, args) => window.__TAURI_INTERNALS__.invoke(command, args)

// Commands that exist in Rust today. Everything else keeps rejecting with a
// readable error until phases 3-7 fill the rest in.
const IMPLEMENTED = {
  prompts: {
    health: () => invoke("db_health"),
  },
}

const pending = (path) => () => Promise.reject(new Error(`${path} is not implemented in Tauri yet`))

// Event subscriptions must return an unsubscribe function, not a promise.
const SUBSCRIPTIONS = new Set(["onNavigate", "onGlobalSearch", "onEvent", "onMaximizeChange"])
const subscribe = () => () => {}

export const api = new Proxy(
  {},
  {
    get: (_target, group) =>
      new Proxy(
        {},
        {
          get: (_group, method) => {
            const name = String(group)
            const key = String(method)
            const implemented = IMPLEMENTED[name]?.[key]
            if (implemented) return implemented
            return SUBSCRIPTIONS.has(key) ? subscribe : pending(`${name}.${key}`)
          },
        },
      ),
  },
)
