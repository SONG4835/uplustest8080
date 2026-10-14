// 판정 스크립트. 단계별 게이트를 돌리고 harness/out/05-verify.json에 결과를 쓴다.
// 사용: node harness/scripts/verify.mjs [--stage S1|S2|S3|S4|S5]   (기본 S5 = 전체)
// exit 0 = 통과, 1 = 실패, 3 = 같은 게이트 연속 3회 실패로 중단
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"
import { ROOT } from "../lib/docs.mjs"
import * as S from "../checks/static.mjs"
import { load, save } from "./state.mjs"

const stage = process.argv.includes("--stage") ? process.argv[process.argv.indexOf("--stage") + 1] : "S5"
const APP = join(ROOT, "app")
const STAGE_NO = (s) => Number(String(s).slice(1)) || 0

// 단계별 게이트 목록
const PLAN = {
  S1: ["G0", "S1-shape", "G2-spec"],
  S2: ["G0", "G1-pages", "G8-pages"],
  S3: ["G0", "G7", "G8", "G9"],
  S4: ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"],
}
PLAN.S5 = PLAN.S4
if (!PLAN[stage]) {
  console.error(`--stage는 S1~S5 중 하나`)
  process.exit(2)
}
const FAIL_FAST = new Set(["G0", "G3", "G4"]) // ★ 핵심 규칙 + 읽기 전용 보호
const NAME = {
  G0: "읽기 전용 보호", "S1-shape": "01-spec.json 형식", "G2-spec": "spec = PRD", "G1-pages": "pages 라우트 = 화면",
  "G8-pages": "pages 컴포넌트 ⊂ 17종", G1: "화면 수 = 라우트 수", G2: "데이터 일치", G3: "★금액 최대 2개",
  G4: "★무제한 속도 문구", G5: "PRD 규칙 ①②④⑥⑦", G6: "인라인 예외", G7: "토큰 밖 값 0", G8: "컴포넌트 화이트리스트", G9: "build·lint", G10: "클래스 = 빌드 CSS",
}

const sh = (cmd, cwd = APP) => {
  try {
    return { ok: true, out: execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe", env: { ...process.env, HARNESS_ROOT: ROOT } }) }
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}
const appReady = () => existsSync(join(APP, "node_modules"))
const SETUP = { pass: false, detail: ["app/node_modules 없음 → node harness/scripts/scaffold.mjs --install 먼저 실행"], back: "setup" }

// vitest(G2~G6)를 한 번 돌리고 게이트별로 나눈다
let vitestCache
function vitest(pattern) {
  if (vitestCache) return vitestCache
  if (!appReady()) return (vitestCache = null)
  const dir = join(APP, ".harness-tests")
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const f of readdirSync(join(ROOT, "harness/checks")).filter((f) => f.endsWith(".test.tsx"))) {
    cpSync(join(ROOT, "harness/checks", f), join(dir, f))
  }
  const outFile = join(dir, "result.json")
  const filter = pattern ? ` -t "${pattern}"` : ""
  const run = sh(`npx vitest run --reporter=json --outputFile=.harness-tests/result.json${filter}`)
  const byGate = {}
  if (existsSync(outFile)) {
    const json = JSON.parse(readFileSync(outFile, "utf8"))
    for (const file of json.testResults ?? []) {
      if (file.status === "failed" && !(file.assertionResults ?? []).length) {
        byGate._load = [`테스트 파일 실행 실패: ${(file.message ?? "").split("\n")[0]}`]
      }
      for (const t of file.assertionResults ?? []) {
        const g = (t.ancestorTitles?.[0] ?? "").match(/^\[(G\d(?:-spec)?)\]/)?.[1]
        if (!g) continue
        byGate[g] ??= []
        if (t.status === "failed") byGate[g].push(`${t.ancestorTitles.slice(1).concat(t.title).join(" > ")}: ${(t.failureMessages?.[0] ?? "").split("\n")[0]}`)
      }
    }
  } else byGate._load = [`vitest 실행 실패: ${run.out.split("\n").slice(0, 3).join(" ")}`]
  return (vitestCache = byGate)
}
function fromVitest(...gates) {
  const r = vitest(stage === "S1" ? "\\[G2-spec\\]" : undefined)
  if (r === null) return SETUP
  if (r._load) return { pass: false, detail: r._load }
  const ran = gates.filter((g) => g in r)
  if (!ran.length) return { pass: false, detail: [`${gates.join("/")} 테스트가 실행되지 않음`] }
  const detail = gates.flatMap((g) => r[g] ?? [])
  return { pass: detail.length === 0, detail, specFailed: (r["G2-spec"] ?? []).length > 0 }
}

function g9() {
  if (!appReady()) return SETUP
  const steps =
    stage === "S3"
      ? [["tsc", "npx tsc --noEmit -p tsconfig.components.json"], ["eslint", "npx eslint src/components"]]
      : [["tsc", "npx tsc --noEmit -p tsconfig.json"], ["eslint", "npx eslint src"], ["vite build", "npx vite build"]]
  const detail = []
  for (const [name, cmd] of steps) {
    const r = sh(cmd)
    if (!r.ok) detail.push(`${name} 실패: ${r.out.split("\n").filter(Boolean).slice(0, 3).join(" | ")}`)
  }
  return { pass: detail.length === 0, detail }
}

// 실패 시 복귀 단계
const touches = (detail, folder) => detail.some((d) => d.includes(folder))
function backOf(id, r) {
  if (r.back) return r.back
  switch (id) {
    case "G0": return "stop"
    case "S1-shape": case "G2-spec": return "S1"
    case "G1-pages": case "G8-pages": return "S2"
    case "G1": return touches(r.detail, "routes.tsx 없음") ? "S4" : "S2"
    case "G2": return r.specFailed ? "S1" : "S4"
    case "G7": case "G8": case "G9": case "G10": return touches(r.detail, "components") && !touches(r.detail, "screens") ? "S3" : stage === "S3" ? "S3" : "S4"
    default: return "S4"
  }
}

const RUN = {
  G0: S.g0ReadOnly,
  "S1-shape": S.specShape,
  "G2-spec": () => fromVitest("G2-spec"),
  "G1-pages": S.g1Pages,
  "G8-pages": S.g8Pages,
  G1: S.g1Routes,
  G2: () => fromVitest("G2-spec", "G2"),
  G3: () => fromVitest("G3"),
  G4: () => fromVitest("G4"),
  G5: () => fromVitest("G5"),
  G6: () => fromVitest("G6"),
  G7: () => S.g7Tokens(stage === "S3" ? "components" : "all"),
  G8: () => S.g8Components(stage === "S3" ? "components" : "all"),
  G9: g9,
  G10: S.g10Classes,
}

const gates = []
let stopped = null
for (const id of PLAN[stage]) {
  if (stopped) {
    gates.push({ id, name: NAME[id], pass: null, detail: [`${stopped} 실패로 건너뜀`] })
    continue
  }
  const r = RUN[id]()
  const g = { id, name: NAME[id], pass: r.pass, detail: r.detail.slice(0, 20) }
  if (!r.pass) g.back = backOf(id, r)
  gates.push(g)
  if (!r.pass && FAIL_FAST.has(id)) stopped = id
}
rmSync(join(APP, ".harness-tests"), { recursive: true, force: true })

// 연속 실패 횟수 기록
const state = load()
for (const g of gates) if (g.pass !== null) state.failStreak[g.id] = g.pass ? 0 : (state.failStreak[g.id] ?? 0) + 1
const pass = gates.every((g) => g.pass === true)
const halt = gates.some((g) => (state.failStreak[g.id] ?? 0) >= 3)
const failed = gates.filter((g) => g.pass === false)
const back = failed.length ? failed.map((g) => g.back).sort((a, b) => STAGE_NO(a) - STAGE_NO(b))[0] : null
state.lastVerify = { stage, pass, at: new Date().toISOString() }
save(state)

const report = { stage, pass, halt, back, gates }
mkdirSync(join(ROOT, "harness/out"), { recursive: true })
writeFileSync(join(ROOT, "harness/out/05-verify.json"), JSON.stringify(report, null, 2) + "\n")

console.log(`\n하네스 verify --stage ${stage}: ${pass ? "PASS" : "FAIL"}${halt ? " (중단: 같은 게이트 연속 3회 실패)" : ""}`)
for (const g of gates) {
  const mark = g.pass === true ? "✅" : g.pass === false ? "❌" : "⏭"
  console.log(`${mark} ${g.id.padEnd(9)} ${g.name}${g.pass === false ? `  → ${g.back}  ${g.detail[0] ?? ""}` : ""}`)
}
if (back) console.log(`\n복귀 단계: ${back}`)
process.exit(pass ? 0 : halt ? 3 : 1)
