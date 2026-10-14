// PreToolUse 훅. 쓰기 전에 거부한다. verify.mjs가 같은 규칙을 다시 확인하므로 우회해도 게이트에서 걸린다.
// 막는 것: ① docs/·reference/ 쓰기 ② tokens.css 손수정 ③ 하네스 파일 수정 ④ 에이전트 편집 폴더 밖 쓰기
//          ⑤ 메인 대화의 app/ 직접 구현 ⑥ 토큰 밖 값이 든 내용 ⑦ verifier의 verify.mjs 외 Bash
import { readFileSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { scanContent, isScanned } from "../lib/scan.mjs"

// 에이전트 → 편집 폴더 1개 (verifier는 없음)
const FOLDER = {
  "spec-reader": "harness/out/spec/",
  "page-planner": "harness/out/pages/",
  "component-builder": "app/src/components/",
  "screen-builder": "app/src/screens/",
  verifier: null,
  "PRD-Checker": "docs/PRD.md", // 기존 PRD 검토 에이전트
}
const HARNESS_FILES = ["harness/checks/", "harness/lib/", "harness/scripts/", "harness/hooks/", "harness/CONTRACT.md", ".claude/", "CLAUDE.md"]
const VERIFY_CMD = /^node harness\/scripts\/verify\.mjs( --stage S[1-5])?$/

function deny(reason) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: `[하네스 훅] ${reason}` } }),
  )
  process.exit(0)
}

let input
try {
  input = JSON.parse(readFileSync(0, "utf8"))
} catch {
  process.exit(0) // 입력을 못 읽으면 결정하지 않는다 (verify가 최종 판정)
}
const agent = input.agent_type ?? null
const tool = input.tool_name
const ti = input.tool_input ?? {}
const maint = process.env.HARNESS_MAINTENANCE === "1"

// ⑦ verifier는 verify.mjs만 실행
if (tool === "Bash") {
  if (agent === "verifier" && !VERIFY_CMD.test(String(ti.command ?? "").trim())) deny("verifier는 `node harness/scripts/verify.mjs [--stage S<n>]`만 실행할 수 있음")
  process.exit(0)
}

const file = ti.file_path ?? ti.notebook_path
if (!file) process.exit(0)
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p)
const relRaw = relative(resolve(root), resolve(root, file)).replace(/\\/g, "/")
if (relRaw.startsWith("..") || isAbsolute(relRaw)) process.exit(0) // 프로젝트 밖
const rel = norm(relRaw)
const under = (prefix) => rel === norm(prefix) || rel.startsWith(norm(prefix))

// ① 읽기 전용
if (under("reference/")) deny("reference/는 읽기 전용")
if (under("docs/") && !(agent === "PRD-Checker" && rel === norm("docs/PRD.md"))) deny("docs/는 읽기 전용")
// ② 생성 파일
if (under("app/src/styles/tokens.css")) deny("tokens.css는 gen-tokens.mjs가 만든다. docs/tokens.json이 SSOT")
// ③ 하네스 자체
if (!maint && HARNESS_FILES.some(under)) deny(`${relRaw}는 하네스 판정·규칙 파일 (수정하려면 HARNESS_MAINTENANCE=1)`)

// ④ 에이전트 편집 폴더
if (agent && agent in FOLDER) {
  const folder = FOLDER[agent]
  if (!folder) deny(`${agent}는 읽기 전용 판정자`)
  if (!under(folder)) deny(`${agent}의 편집 폴더는 ${folder} 하나 (요청: ${relRaw})`)
} else if (!maint && (under("app/") || under("harness/"))) {
  // ⑤ 메인 대화(또는 하네스 밖 에이전트)는 직접 구현하지 않는다
  deny(`메인 대화는 ${relRaw}를 직접 쓰지 않는다. 담당 에이전트를 호출할 것`)
}

// ⑥ 토큰 밖 값
if (isScanned(relRaw)) {
  const text =
    tool === "Write" ? ti.content ?? "" : tool === "MultiEdit" ? (ti.edits ?? []).map((e) => e.new_string).join("\n") : ti.new_string ?? ""
  const v = scanContent(relRaw, text)
  if (v.length) deny(`토큰 밖 값 ${v.length}개:\n` + v.slice(0, 10).map((x) => `  ${x.token} — ${x.reason}`).join("\n"))
}
process.exit(0)
