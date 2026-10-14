// docs/ 읽기 전용 파서. 서비스에 무관한(공통) 값만 뽑는다.
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
export const read = (rel) => readFileSync(join(ROOT, rel), "utf8")

// screens.md: 각 "### 라우트" 아래 첫 번째 비어 있지 않은 줄
export function screenRoutes() {
  const lines = read("docs/screens.md").split(/\r?\n/)
  const routes = []
  lines.forEach((line, i) => {
    if (line.trim() !== "### 라우트") return
    const next = lines.slice(i + 1).find((l) => l.trim() !== "")
    if (next) routes.push(next.trim())
  })
  return routes
}

// "/plans/[id]" → "/plans/:id"
export const toRouterPath = (p) => p.replace(/\[(\w+)\]/g, ":$1")

// Design.md 4장의 "#### `Name`" 헤딩 = 컴포넌트 화이트리스트
export function designComponents() {
  const md = read("docs/Design.md")
  const sec = md.slice(md.indexOf("## 4."))
  return [...sec.matchAll(/^####\s+`([^`]+)`/gm)].map((m) => m[1])
}

// "Card/Plan" → "CardPlan", "icon/arrowLeft" → "IconArrowLeft"
export const componentFile = (name) =>
  name
    .split("/")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("")

// Design.md 3·4장에 적힌 px 숫자 = width/height 허용값
export function designSizes() {
  const md = read("docs/Design.md")
  const sec = md.slice(md.indexOf("## 3."))
  const nums = new Set()
  for (const m of sec.matchAll(/(\d+)\s*×\s*(\d+)\s*px/g)) {
    nums.add(Number(m[1]))
    nums.add(Number(m[2]))
  }
  for (const m of sec.matchAll(/(\d+)\s*px/g)) nums.add(Number(m[1]))
  nums.delete(9999) // radius/full 값은 크기가 아님
  return nums
}
