import { describe, expect, it } from "vitest"

describe("api adapter", () => {
  it("Tauri adapter wires updater commands and events", async () => {
    const invoke = () => Promise.resolve({ status: "idle" })
    globalThis.window = {
      __TAURI_INTERNALS__: { invoke },
      addEventListener: () => {},
      removeEventListener: () => {},
    }
    const { api } = await import("./tauri.js")

    await expect(api.update.getStatus()).resolves.toEqual({ status: "idle" })
    const unsubscribe = api.update.onEvent(() => {})
    expect(typeof unsubscribe).toBe("function")
    unsubscribe()
  })
})
