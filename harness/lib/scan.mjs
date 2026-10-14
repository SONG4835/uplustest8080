// G7 토큰 검사기. verify.mjs(G7)와 훅(guard.mjs)이 같은 함수를 쓴다.
// scanContent(relPath, text) → [{ line, token, reason }]
import { designSizes } from "./docs.mjs"
import { semanticColors, spacing, radius, textStyles } from "./tokens.mjs"

let cache
function allowed() {
  if (cache) return cache
  const colors = semanticColors().map((c) => c.cls)
  const role = (...groups) => new Set(colors.filter((c) => groups.some((g) => c.startsWith(g + "-"))))
  cache = {
    spacing: new Set(["0", ...spacing().map((s) => s.name)]),
    radius: new Set(["none", ...radius().map((r) => r.name)]),
    textStyle: new Set(textStyles().map((t) => t.cls)),
    sizes: designSizes(),
    // 역할별 semantic 색: 글자색은 text/icon, 배경은 bg/fill/surface/brand, 테두리는 border
    textColor: role("text", "icon"),
    bgColor: role("bg", "fill", "surface", "brand"),
    borderColor: role("border"),
    svgColor: role("icon", "fill", "brand"),
  }
  return cache
}

export function zoneOf(rel) {
  const p = rel.replace(/\\/g, "/")
  if (p.startsWith("app/src/components/")) return "components"
  if (p.startsWith("app/src/screens/")) return "screens"
  return "other"
}

// 검사 대상: 에이전트 편집 폴더 + app/src의 손으로 쓴 css
export function isScanned(rel) {
  const p = rel.replace(/\\/g, "/")
  if (!p.startsWith("app/src/")) return false
  if (p === "app/src/styles/tokens.css" || p === "app/src/index.css") return false
  return /\.(tsx?|css)$/.test(p)
}

const SPACE = /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left)-(.+)$/
const SIZE = /^(w|h|min-w|min-h|max-w|max-h|size)-(.+)$/
const ROUND = /^rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/

function checkUtility(raw, zone) {
  const a = allowed()
  const u = raw.split(":").pop().replace(/^!/, "").replace(/^-/, "")
  let m
  if ((m = u.match(SPACE))) {
    const v = m[2]
    if (a.spacing.has(v) || (v === "auto" && /^(m|inset|top|right|bottom|left)/.test(m[1]))) return null
    return `간격 ${v}은 spacing 토큰이 아님`
  }
  if ((m = u.match(SIZE))) {
    const v = m[2]
    if (zone === "screens") return v === "full" ? null : "화면(screens)에서는 w-full 외 크기 지정 금지"
    if (a.spacing.has(v) || ["full", "screen", "auto", "fit", "min", "max"].includes(v)) return null
    const px = v.match(/^\[(\d+)px\]$/)
    if (px && a.sizes.has(Number(px[1]))) return null
    return `크기 ${v}은 Design.md 크기/spacing 토큰이 아님`
  }
  if ((m = u.match(ROUND))) {
    if (m[1] && a.radius.has(m[1])) return null
    return `모서리 ${m[1] ?? "(기본)"}은 radius 토큰이 아님`
  }
  if ((m = u.match(/^text-(.+)$/))) {
    const v = m[1]
    if (a.textStyle.has(v) || a.textColor.has(v)) return null
    if (["left", "center", "right", "start", "end", "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip"].includes(v)) return null
    return `text-${v}: 텍스트 스타일/text·icon 색 토큰이 아님`
  }
  if ((m = u.match(/^bg-(.+)$/))) {
    if (a.bgColor.has(m[1]) || ["transparent", "none"].includes(m[1])) return null
    return `bg-${m[1]}: bg/fill/surface 색 토큰이 아님`
  }
  if ((m = u.match(/^(?:border|divide)(?:-(?:t|r|b|l|x|y|s|e))?(?:-(.+))?$/))) {
    const v = m[1]
    if (v === undefined || ["0", "solid", "dashed", "none"].includes(v) || a.borderColor.has(v)) return null
    return `border-${v}: border 색 토큰이 아니거나 허용되지 않은 두께`
  }
  if ((m = u.match(/^(fill|stroke)-(.+)$/))) {
    if (a.svgColor.has(m[2]) || ["current", "none"].includes(m[2])) return null
    return `${m[1]}-${m[2]}: icon/fill 색 토큰이 아님`
  }
  if ((m = u.match(/^font-(.+)$/))) return m[1] === "sans" ? null : "font-* 개별 지정 금지 (텍스트 스타일 사용)"
  if (/^(leading|tracking)-/.test(u)) return "줄높이·자간 개별 지정 금지 (텍스트 스타일 사용)"
  if (/^(shadow|opacity|ring)-/.test(u) || u === "shadow" || u === "ring") {
    return ["shadow-none", "ring-0"].includes(u) ? null : `${u}: 대응하는 토큰이 없음`
  }
  if (/^outline-/.test(u)) return ["outline-none", "outline-hidden", "outline-0"].includes(u) ? null : `${u}: 대응하는 토큰이 없음`
  if (u.includes("[")) return `임의값 ${u} 금지`
  return null
}

export function scanContent(rel, text) {
  const zone = zoneOf(rel)
  const out = []
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    const push = (token, reason) => out.push({ line: i + 1, token, reason })
    for (const m of line.matchAll(/(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)) push(m[0], "hex 색 직접 사용 금지")
    for (const m of line.matchAll(/\b(rgba?|hsla?|oklch|oklab|hwb|lab|lch)\(/g)) push(m[0], "색 함수 직접 사용 금지")
    if (/\bstyle\s*=\s*\{/.test(line)) push("style=", "인라인 style 금지")
    // 문자열 리터럴 안의 클래스 토큰
    for (const s of line.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)) {
      for (const tok of s[2].split(/\s+/).filter(Boolean)) {
        if (!/^[!\-a-z0-9:]*[a-z][\w\-:./\[\]%!]*$/.test(tok)) continue
        const reason = checkUtility(tok, zone)
        if (reason) push(tok, reason)
      }
    }
    // 유틸리티 밖에 남은 단위 값 (예: "13px", 1.5rem)
    const rest = line.replace(/\b[\w:-]+-\[\d+px\]/g, "")
    for (const m of rest.matchAll(/(?<![\w.])\d+(?:\.\d+)?(px|rem|em)\b/g)) push(m[0], "토큰 밖 단위 값")
  })
  if (rel.endsWith(".css")) out.push({ line: 1, token: rel, reason: "새 .css 파일 금지 (tokens.css·index.css만)" })
  return out
}
