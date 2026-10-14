// 사람 승인용 스크린샷 4장 (390×844). verify --stage S5 통과 후에만 실행한다.
// 사용: node harness/scripts/screenshot.mjs   → harness/out/shots/{plans,detail-p03,apply-p03,complete}.png
import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import { spawn, execSync } from "node:child_process"
import { ROOT } from "../lib/docs.mjs"
import { load } from "./state.mjs"

const s = load()
if (!s.lastVerify?.pass || s.lastVerify.stage !== "S5") {
  console.error("verify --stage S5가 통과한 뒤에만 스크린샷을 찍는다")
  process.exit(1)
}

const APP = join(ROOT, "app")
const OUT = join(ROOT, "harness/out/shots")
const PORT = 4173
const BASE = `http://localhost:${PORT}`
const { chromium } = createRequire(join(APP, "package.json"))("playwright")

execSync("npx vite build", { cwd: APP, stdio: "inherit" })
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: APP, shell: true })

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error("vite preview가 뜨지 않음")
}

try {
  await waitUp()
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const shot = (name) => page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true })

  await page.goto(`${BASE}/plans`)
  await shot("plans")
  await page.goto(`${BASE}/plans/p03`)
  await shot("detail-p03")
  await page.goto(`${BASE}/apply?plan=p03`)
  await shot("apply-p03")
  // 누가 봐도 가짜인 값으로 신청
  await page.getByLabel("이름").fill("홍길동")
  await page.getByLabel("휴대폰 번호").fill("01000000000")
  await page.getByRole("checkbox", { name: /개인정보 수집·이용/ }).check()
  await page.getByRole("button", { name: "신청하기" }).click()
  await page.waitForURL("**/complete")
  await shot("complete")

  await browser.close()
  console.log(`스크린샷 4장: ${OUT}`)
} finally {
  server.kill()
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" })
    } catch {}
  }
}
