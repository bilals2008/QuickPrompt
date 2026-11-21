// Tauri adapter. The Rust commands arrive in phases 2-7; until then every
// call rejects with a readable error instead of "undefined is not a function".
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
          get: (_group, method) =>
            SUBSCRIPTIONS.has(method) ? subscribe : pending(`${String(group)}.${String(method)}`),
        },
      ),
  },
)
