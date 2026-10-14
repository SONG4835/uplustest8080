// node만으로 도는 공통 게이트: G0 · G1 · G7 · G8 (+ S1·S2 산출물 형식)
// 각 함수는 { pass, detail: string[] } 를 돌려준다.
import { execSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { ROOT, screenRoutes, toRouterPath, designComponents, componentFile } from "../lib/docs.mjs"
import { scanContent, isScanned } from "../lib/scan.mjs"

const result = (detail) => ({ pass: detail.length === 0, detail })
const abs = (rel) => join(ROOT, rel)
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x))

function walk(rel) {
  if (!existsSync(abs(rel))) return []
  return readdirSync(abs(rel)).flatMap((f) => {
    const r = `${rel}/${f}`
    return statSync(abs(r)).isDirectory() ? walk(r) : [r]
  })
}

// G0: docs/·reference/는 커밋된 상태 그대로 (수정·추가·삭제 0건)
export function g0ReadOnly() {
  const out = execSync("git status --porcelain -- docs reference", { cwd: ROOT, encoding: "utf8" }).trim()
  return result(out ? out.split("\n").map((l) => `읽기 전용 폴더 변경: ${l.trim()}`) : [])
}

// G1-pages: 02-pages.json의 route 집합 = screens.md 라우트 집합, *Page.tsx 4개
export function g1Pages() {
  const f = "harness/out/pages/02-pages.json"
  if (!existsSync(abs(f))) return result([`${f} 없음`])
  const pages = JSON.parse(readFileSync(abs(f), "utf8")).pages ?? []
  const want = screenRoutes()
  const got = pages.map((p) => p.route)
  const d = []
  if (!sameSet(got, want)) d.push(`라우트 불일치: 기대 ${want.join(", ")} / 실제 ${got.join(", ")}`)
  for (const p of pages) if (!/^[A-Z]\w*Page\.tsx$/.test(p.file ?? "")) d.push(`${p.route}: file 이름은 <이름>Page.tsx`)
  return result(d)
}

// G1-routes: routes.tsx의 path 집합 = screens.md 라우트, screens/*Page.tsx = 라우트 수
export function g1Routes() {
  const f = "app/src/screens/routes.tsx"
  if (!existsSync(abs(f))) return result([`${f} 없음`])
  const src = readFileSync(abs(f), "utf8")
  const got = [...src.matchAll(/\bpath\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1])
  const want = screenRoutes().map(toRouterPath)
  const d = []
  if (!sameSet(got, want)) d.push(`라우트 ${got.length}개 ≠ 화면 ${want.length}개: 기대 ${want.join(", ")} / 실제 ${got.join(", ")}`)
  const pageFiles = walk("app/src/screens").filter((p) => /Page\.tsx$/.test(p))
  if (pageFiles.length !== want.length) d.push(`*Page.tsx ${pageFiles.length}개 ≠ 화면 ${want.length}개`)
  return result(d)
}

// G7: 토큰 밖 값 0개 (scope: "components" | "screens" | "all")
export function g7Tokens(scope = "all") {
  const dirs = scope === "all" ? ["app/src"] : [`app/src/${scope}`]
  const d = []
  for (const rel of dirs.flatMap(walk).filter(isScanned)) {
    for (const v of scanContent(rel, readFileSync(abs(rel), "utf8"))) d.push(`${rel}:${v.line} ${v.token} — ${v.reason}`)
  }
  return result(d)
}

const allowedNames = () => designComponents()

// G8-pages: 02-pages.json의 컴포넌트 이름 ⊂ Design.md 17종 (소문자 HTML 태그는 허용)
export function g8Pages() {
  const f = "harness/out/pages/02-pages.json"
  if (!existsSync(abs(f))) return result([`${f} 없음`])
  const names = allowedNames()
  const d = []
  const visit = (nodes, route) => {
    for (const n of nodes ?? []) {
      if (!/^[a-z][a-z0-9]*$/.test(n.name) && !names.includes(n.name)) d.push(`${route}: 화이트리스트 밖 컴포넌트 ${n.name}`)
      visit(n.children, route)
    }
  }
  for (const p of JSON.parse(readFileSync(abs(f), "utf8")).pages ?? []) visit(p.components, p.route)
  return result(d)
}

// G8: components/ 파일 = 17종 정확히, screens/의 대문자 JSX ⊂ 17종 + *Page + Navigate/Fragment
export function g8Components(scope = "all") {
  const names = allowedNames().map(componentFile)
  const d = []
  if (scope === "all" || scope === "components") {
    const files = walk("app/src/components").map((p) => p.split("/").pop())
    const got = files.map((f) => f.replace(/\.tsx$/, ""))
    for (const n of names) if (!got.includes(n)) d.push(`components/${n}.tsx 없음`)
    for (const f of files) if (!/\.tsx$/.test(f) || !names.includes(f.replace(/\.tsx$/, ""))) d.push(`components/${f}: 17종 밖 파일`)
  }
  if (scope === "all" || scope === "screens") {
    const extra = ["Navigate", "Fragment"]
    for (const rel of walk("app/src/screens").filter((p) => /\.tsx$/.test(p))) {
      const src = readFileSync(abs(rel), "utf8")
      for (const m of src.matchAll(/<([A-Z]\w*)/g)) {
        const tag = m[1]
        if (names.includes(tag) || extra.includes(tag) || /Page$/.test(tag)) continue
        d.push(`${rel}: 화이트리스트 밖 컴포넌트 <${tag}>`)
      }
    }
  }
  return result([...new Set(d)])
}

// G10: 코드에 쓴 Tailwind 클래스가 빌드된 CSS에 실제로 있다 (없는 클래스는 Tailwind가 조용히 버린다)
const UTIL_ROOT = /^-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|w|h|min-w|min-h|max-w|max-h|size|text|bg|border|divide|rounded|fill|stroke|font|leading|tracking|shadow|opacity|ring|outline|z|flex|grid|grid-cols|grid-rows|col|row|items|justify|self|place|content|order|shrink|grow|basis|overflow|truncate|whitespace|break|line-clamp|fixed|sticky|absolute|relative|static|block|inline|inline-flex|inline-block|hidden|sr-only|cursor|pointer-events|select|appearance|transition|duration|ease|aspect|object|underline|accent|caret)(-|$)/
// CSS 선택자 이스케이프: hover:bg-x → hover\:bg-x, w-[358px] → w-\[358px\]
const cssEscape = (c) => c.replace(/[:[\]/.%!#()]/g, (ch) => "\\" + ch)
const reEscape = (s) => s.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&")

export function g10Classes() {
  const dist = "app/dist/assets"
  const cssFiles = walk(dist).filter((p) => p.endsWith(".css"))
  if (!cssFiles.length) return result([`${dist}/*.css 없음 (G9 vite build 먼저)`])
  const css = cssFiles.map((p) => readFileSync(abs(p), "utf8")).join("\n")
  const d = []
  for (const rel of [...walk("app/src/components"), ...walk("app/src/screens")].filter((p) => /\.tsx?$/.test(p))) {
    const src = readFileSync(abs(rel), "utf8")
    const seen = new Set()
    for (const s of src.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)) {
      for (const tok of s[2].split(/\s+/).filter(Boolean)) {
        if (seen.has(tok) || !/^[!\-a-z0-9:]*[a-z][\w\-:./\[\]%!]*$/.test(tok)) continue
        if (!UTIL_ROOT.test(tok.split(":").pop().replace(/^!/, ""))) continue
        seen.add(tok)
        if (!new RegExp("\\." + reEscape(cssEscape(tok)) + "(?![\\w-])").test(css)) {
          d.push(`${rel}: ${tok} — 빌드 CSS에 생성되지 않음 (토큰에 없는 값)`)
        }
      }
    }
  }
  return result(d)
}

// S1 형식: 01-spec.json 필수 키
export function specShape() {
  const f = "harness/out/spec/01-spec.json"
  if (!existsSync(abs(f))) return result([`${f} 없음`])
  let spec
  try {
    spec = JSON.parse(readFileSync(abs(f), "utf8"))
  } catch (e) {
    return result([`${f} JSON 파싱 실패: ${e.message}`])
  }
  const d = []
  for (const k of ["routes", "plans", "filters", "copy", "nav", "rules"]) if (!(k in spec)) d.push(`01-spec.json에 ${k} 없음`)
  const fields = ["id", "name", "monthly_price", "data", "throttle_after", "price_after_discount", "discount_months", "description", "recommended"]
  for (const p of spec.plans ?? []) for (const k of fields) if (!(k in p)) d.push(`plans.${p.id ?? "?"}.${k} 없음`)
  if (spec.routes && !sameSet(spec.routes, screenRoutes())) d.push(`routes ≠ screens.md 라우트`)
  return result(d)
}
