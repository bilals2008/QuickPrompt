// Temporary check: FolderGlyph must compose folder shape + centre emblem.
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FolderGlyph } from "@/components/folders/FolderGlyph"

const render = (folder) =>
  renderToStaticMarkup(createElement(FolderGlyph, { folder, size: 48 }))

describe("FolderGlyph", () => {
  it("renders a tabler glyph inside the folder badge", () => {
    const html = render({ icon: "tabler:rocket", color: "#f59e0b" })
    expect(html).toContain('viewBox="0 0 48 48"')
    expect(html).toContain('r="8"')
    expect(html).toContain("scale(0.458)")
    expect(html).toContain('viewBox="0 0 24 24"')
    console.log(html)
  })

  it("renders an uploaded image inside the folder badge", () => {
    const html = render({ icon: "qpicon://icon/abc.png" })
    expect(html).toContain("<image")
    expect(html).toContain('href="qpicon://icon/abc.png"')
  })

  it("still renders the built-in folder icons", () => {
    const html = render({ icon: "camera" })
    expect(html).toContain('viewBox="0 0 48 48"')
    expect(html).not.toContain("<image")
  })

  it("applies emblem scale and offset from the folder appearance", () => {
    const html = render({
      icon: "tabler:rocket",
      appearance: JSON.stringify({ size: "normal", emblem: { color: "#ef4444", scale: 1.28, dx: 2, dy: -1 } }),
    })
    expect(html).toContain("translate(2 -1)")
    expect(html).toContain("scale(1.28)")
    expect(html).toContain('color="#ef4444"')
  })

  it("tints the folder body with the folder colour when a center icon is used", () => {
    const html = render({ icon: "tabler:rocket", color: "#f97316" })
    expect(html).toContain("color:#f97316")
  })

  it("grows the badge with the emblem size", () => {
    const html = render({
      icon: "tabler:rocket",
      appearance: JSON.stringify({ emblem: { scale: 1.55 } }),
    })
    expect(html).toContain("scale(1.55)")
  })

  it("drops the white badge when the background is set to none", () => {
    const html = render({
      icon: "tabler:rocket",
      appearance: JSON.stringify({ emblem: { badge: "none" } }),
    })
    expect(html).not.toContain('fill="#ffffff"')
  })
})
