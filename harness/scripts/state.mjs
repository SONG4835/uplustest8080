// harness/out/state.json 읽기·쓰기. 메인(오케스트레이터)이 단계 이동·승인을 기록할 때 쓴다.
// 사용:
//   node harness/scripts/state.mjs show
//   node harness/scripts/state.mjs stage S3            현재 단계 지정 (재시작 지점)
//   node harness/scripts/state.mjs passed S3           S3 통과 기록, 다음 단계로 (그다음 커밋)
//   node harness/scripts/state.mjs approve             사람 승인 기록
//   node harness/scripts/state.mjs reject visual|flow "<사유>"   visual → S3, flow → S4
//   node harness/scripts/state.mjs resume              이어 하기 지점 확인 (마지막 harness 커밋과 불일치 경고)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"
import { ROOT } from "../lib/docs.mjs"

export const STATE = join(ROOT, "harness/out/state.json")
const STAGES = ["S1", "S2", "S3", "S4", "S5"]
const blank = () => ({ stage: "S1", passed: [], failStreak: {}, approved: false, rejections: [], lastVerify: null })

export function load() {
  return existsSync(STATE) ? { ...blank(), ...JSON.parse(readFileSync(STATE, "utf8")) } : blank()
}
export function save(s) {
  mkdirSync(join(ROOT, "harness/out"), { recursive: true })
  writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n")
}
// 마지막 "harness(S<n>): ..." 커밋의 단계
const lastHarnessCommit = () =>
  execSync('git log -1 --format=%h%x20%s --grep "^harness(S"', { cwd: ROOT, encoding: "utf8" }).trim()

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("harness/scripts/state.mjs")
if (isMain) {
  const [cmd, a, b] = process.argv.slice(2)
  const s = load()
  const need = (x) => {
    if (!STAGES.includes(x)) throw new Error(`단계는 ${STAGES.join("|")} 중 하나`)
  }
  switch (cmd) {
    case "stage":
      need(a)
      s.stage = a
      s.approved = false
      break
    case "passed":
      need(a)
      s.passed = [...new Set([...s.passed, a])]
      s.stage = STAGES[Math.min(STAGES.indexOf(a) + 1, STAGES.length - 1)]
      break
    case "approve":
      if (!s.lastVerify?.pass || s.lastVerify.stage !== "S5") throw new Error("S5 verify가 통과한 뒤에만 승인할 수 있음")
      s.approved = true
      break
    case "reject":
      if (!["visual", "flow"].includes(a) || !b) throw new Error('reject visual|flow "<사유>"')
      s.rejections.push({ kind: a, reason: b, at: new Date().toISOString() })
      s.stage = a === "visual" ? "S3" : "S4"
      s.approved = false
      break
    case "resume": {
      const last = lastHarnessCommit()
      const committed = last.match(/harness\((S\d)\)/)?.[1] ?? null
      const done = s.passed.at(-1) ?? null
      console.log(`이어 할 단계: ${s.stage} (통과: ${s.passed.join(", ") || "없음"})`)
      console.log(`마지막 harness 커밋: ${last || "없음"}`)
      if (committed !== done) {
        console.log(`⚠ state.json의 마지막 통과(${done}) ≠ 마지막 커밋 단계(${committed}). 커밋되지 않은 단계가 있음 → ${committed ?? "S1"} 다음 단계부터 다시 진행`)
      }
      process.exit(0)
    }
    case "show":
    case undefined:
      break
    default:
      throw new Error(`알 수 없는 명령: ${cmd}`)
  }
  if (cmd && cmd !== "show") save(s)
  console.log(JSON.stringify(s, null, 2))
}
