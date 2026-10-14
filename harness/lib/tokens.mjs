// docs/tokens.json(SSOT)에서 허용값을 뽑는다. 복사본을 두지 않는다.
import { read } from "./docs.mjs"

export const tokens = () => JSON.parse(read("docs/tokens.json"))

const slug = (name) => name.replace(/\//g, "-")

// semantic 색만 허용. "text/primary" → { cls: "text-primary", hex: "#181A1B" }
export function semanticColors() {
  return tokens()
    .tokens.filter((t) => t.collection === "semantic" && t.type === "color")
    .map((t) => ({ cls: slug(t.name), hex: t.values.Default.resolved ?? t.values.Default }))
}

const numbers = (collection) =>
  tokens()
    .tokens.filter((t) => t.collection === collection)
    .map((t) => ({ name: t.name.split("/")[1], value: t.values.Default }))

// spacing/16 → { name: "16", value: 16 }
export const spacing = () => numbers("spacing")
// radius/full → { name: "full", value: 9999 }
export const radius = () => numbers("radius")

// "heading/h1" → { cls: "heading-h1", size, lineHeight, weight, letterSpacing }
export function textStyles() {
  return tokens().textStyles.map((s) => ({
    cls: slug(s.name),
    size: s.fontSize.resolved ?? s.fontSize,
    lineHeight: s.lineHeight,
    weight: s.fontWeight,
    letterSpacing: s.letterSpacing ?? 0,
  }))
}

export function fontFamily() {
  const t = tokens().tokens.find((x) => x.collection === "typography" && x.name.startsWith("font-family/"))
  return t.values.Default
}
