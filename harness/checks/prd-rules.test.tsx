// 서비스 규칙 게이트 (G2~G6). PRD가 바뀌면 이 파일 하나만 다시 만든다.
// verify.mjs가 app/.harness-tests/로 복사해 vitest(jsdom)로 실행한다. 직접 고치지 않는다.
// 기대값은 하드코딩하지 않고 docs/PRD.md에서 읽는다. 테스트 입력은 누가 봐도 가짜인 값만 쓴다.
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"

const ROOT = process.env.HARNESS_ROOT ?? join(__dirname, "..", "..")
const prd = readFileSync(join(ROOT, "docs/PRD.md"), "utf8")

// ---------- PRD에서 기대값 읽기 ----------
type Plan = {
  id: string; name: string; monthly_price: number; data: string
  throttle_after: string | null; price_after_discount: number | null
  discount_months: number | null; description: string; recommended: boolean
}
const won = (s: string) => Number(s.replace(/[^\d]/g, ""))
const recommendedId = prd.match(/추천 대상은 (p\d+)/)![1]
const PLANS: Plan[] = prd
  .split(/\r?\n/)
  .filter((l) => /^\|\s*p\d+\s*\|/.test(l))
  .map((l) => {
    const [id, name, price, period, data, speed, after, description] = l.split("|").slice(1, -1).map((c) => c.trim())
    return {
      id, name, monthly_price: won(price), data,
      throttle_after: speed.includes("제한 없음") ? null : speed.match(/(\d+Mbps)/)![1],
      price_after_discount: after.includes("할인 없음") ? null : won(after.replace(/\d+개월째부터/, "")),
      discount_months: period.includes("할인 없음") ? null : Number(period.match(/(\d+)/)![1]),
      description, recommended: id === recommendedId,
    }
  })
const byPrice = [...PLANS].sort((a, b) => a.monthly_price - b.monthly_price)
const fmt = (n: number) => `${n.toLocaleString("ko-KR")}원`
const throttleText = (p: Plan) => (p.throttle_after ? `소진 후 ${p.throttle_after}로 제한` : "속도 제한 없음")
const afterText = (p: Plan) => `${(p.discount_months ?? 0) + 1}개월째부터 ${fmt(p.price_after_discount!)}`
const THROTTLE_RE = /소진 후 \d+Mbps로 제한|속도 제한 없음/g
const MONEY_RE = /\d{1,3}(,\d{3})*원/g

const chipLine = prd.split(/\r?\n/).find((l) => l.includes("칩 항목:"))!
const FILTERS = chipLine
  .slice(chipLine.indexOf("칩 항목:") + "칩 항목:".length)
  .split("·")
  .map((s) => s.trim())
  .map((s) => {
    const m = s.match(/^(.+?)\((.+)\)$/)
    return m ? { label: m[1].trim(), ids: m[2].split(",").map((x) => x.trim()) } : { label: s, ids: PLANS.map((p) => p.id) }
  })

const errSection = prd.slice(prd.indexOf("오류 상황과 안내 문구"))
const ERRORS = errSection
  .split(/\r?\n/)
  .filter((l) => /^\|/.test(l) && !/^\|\s*(상황|---)/.test(l))
  .slice(0, 4)
  .map((l) => l.split("|")[2].trim())
const [ERR_NAME, ERR_PHONE, ERR_PRIVACY, ERR_SAVE] = ERRORS
const EMPTY_FILTER = prd.match(/결과가 0개일 때 "([^"]+)"/)![1]
const DONE_TEXT = prd.match(/완료 아이콘, "([^"]+)"/)![1]
const DISCOUNT_CHIP = prd.match(/표시 항목: "(\d+개월 할인)"/)![1]
const FAKE = { name: "홍길동", phone: "01000000000" }

// ---------- 렌더 도우미 ----------
beforeEach(() => {
  vi.resetModules()
  sessionStorage.clear()
  localStorage.clear()
})
afterEach(() => cleanup())

// 화면 파일이 아직 없는 단계(S1)에서도 이 파일이 로드되도록 경로를 변수로 둬 정적 분석을 피한다
const load = (p: string) => import(/* @vite-ignore */ p)

async function mount(path: string) {
  const { routes } = await load("@/screens/routes")
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(<RouterProvider router={router} />)
  await act(async () => {})
  return { router, ...utils }
}
const at = (router: { state: { location: { pathname: string; search: string } } }) =>
  router.state.location.pathname + router.state.location.search
const cards = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>("[data-plan-card]")]
const card = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-plan-card="${id}"]`)!
const priceEls = (el: Element, kind: string) => [...el.querySelectorAll(`[data-price="${kind}"]`)]
function moneyOutsidePrice(el: Element) {
  const clone = el.cloneNode(true) as Element
  clone.querySelectorAll("[data-price]").forEach((n) => n.remove())
  return clone.textContent!.match(MONEY_RE) ?? []
}
function detailParts(c: HTMLElement, id: string) {
  const main = c.querySelector(`[data-plan-detail="${id}"]`)
  return { main, cta: c.querySelector("[data-bottom-cta]") }
}

// ---------- G2 데이터 일치 ----------
describe("[G2-spec] 01-spec.json = PRD", () => {
  const f = join(ROOT, "harness/out/spec/01-spec.json")
  it("plans 4건 × 9필드가 PRD 표와 같다", () => {
    const spec = JSON.parse(readFileSync(f, "utf8"))
    expect(spec.plans).toEqual(PLANS)
  })
  it("오류·안내 문구가 PRD 원문과 같다", () => {
    const spec = JSON.parse(readFileSync(f, "utf8"))
    expect(spec.copy.errors).toEqual({ name: ERR_NAME, phone: ERR_PHONE, privacy: ERR_PRIVACY, save: ERR_SAVE })
    expect(spec.copy.emptyFilter).toBe(EMPTY_FILTER)
    expect(spec.filters.map((x: { label: string; plan_ids: string[] }) => ({ label: x.label, ids: x.plan_ids }))).toEqual(FILTERS)
  })
})

describe("[G2] screens/plans.ts = PRD", () => {
  it("plans 4건 × 9필드가 PRD 표와 같다", async () => {
    const { plans } = await load("@/screens/plans")
    expect([...plans].sort((a: Plan, b: Plan) => a.id.localeCompare(b.id))).toEqual(PLANS)
  })
})

// ---------- ★G3 금액 최대 2개 ----------
describe("[G3] 금액은 매달 내는 금액 1개 + 할인 종료 후 금액 최대 1개", () => {
  it("요금제 카드", async () => {
    const { container } = await mount("/plans")
    for (const p of PLANS) {
      const el = card(container, p.id)
      expect(el, `${p.id} 카드 없음`).toBeTruthy()
      expect(priceEls(el, "monthly"), `${p.id} monthly`).toHaveLength(1)
      expect(priceEls(el, "after-discount").length, `${p.id} after-discount`).toBeLessThanOrEqual(1)
      expect(moneyOutsidePrice(el), `${p.id} data-price 밖 금액`).toEqual([])
      expect(priceEls(el, "monthly")[0].textContent).toContain(fmt(p.monthly_price))
    }
  })
  it.each(PLANS.map((p) => [p.id, p] as const))("요금제 상세 %s", async (id, p) => {
    const { container } = await mount(`/plans/${id}`)
    const { main, cta } = detailParts(container, id)
    expect(main, `data-plan-detail="${id}" 없음`).toBeTruthy()
    expect(priceEls(main!, "monthly")).toHaveLength(1)
    expect(priceEls(main!, "after-discount").length).toBeLessThanOrEqual(1)
    expect(moneyOutsidePrice(main!)).toEqual([])
    expect(priceEls(main!, "monthly")[0].textContent).toContain(fmt(p.monthly_price))
    if (cta) {
      expect(priceEls(cta, "after-discount")).toHaveLength(0)
      expect(priceEls(cta, "monthly").length).toBeLessThanOrEqual(1)
      expect(moneyOutsidePrice(cta)).toEqual([])
      for (const e of priceEls(cta, "monthly")) expect(e.textContent).toContain(fmt(p.monthly_price))
    }
  })
})

// ---------- ★G4 무제한 요금제 속도 문구 ----------
const UNLIMITED = PLANS.filter((p) => p.name.includes("무제한"))
describe("[G4] '무제한' 요금제에는 소진 후 속도 문구가 정확히 1번", () => {
  it("요금제 카드", async () => {
    const { container } = await mount("/plans")
    for (const p of UNLIMITED) {
      const text = card(container, p.id).textContent!
      expect(text.match(THROTTLE_RE), p.id).toEqual([throttleText(p)])
    }
  })
  it.each(UNLIMITED.map((p) => [p.id, p] as const))("요금제 상세 %s", async (id, p) => {
    const { container } = await mount(`/plans/${id}`)
    expect(container.textContent!.match(THROTTLE_RE)).toEqual([throttleText(p)])
  })
})

// ---------- G5 나머지 PRD 규칙 + 화면 기능 ----------
describe("[G5] 요금제 목록", () => {
  it("① 카드는 정확히 4개, 매달 내는 금액이 낮은 순", async () => {
    const { container } = await mount("/plans")
    expect(cards(container).map((c) => c.dataset.planCard)).toEqual(byPrice.map((p) => p.id))
  })
  it("② 추천 Tag는 1개이고 추천 요금제 카드 안에 있다", async () => {
    const { container } = await mount("/plans")
    const tags = container.querySelectorAll('[data-tag="recommended"]')
    expect(tags).toHaveLength(1)
    expect(tags[0].closest("[data-plan-card]")!.getAttribute("data-plan-card")).toBe(recommendedId)
  })
  it("④ 할인 종료 후 금액은 할인 요금제에만, 문구가 정확하다", async () => {
    const { container } = await mount("/plans")
    for (const p of PLANS) {
      const els = priceEls(card(container, p.id), "after-discount")
      if (p.price_after_discount === null) expect(els, p.id).toHaveLength(0)
      else expect(els.map((e) => e.textContent!.trim()), p.id).toEqual([afterText(p)])
    }
  })
  it("모든 카드에 소진 후 속도 문구 1개, 할인 Chip은 할인 요금제에만", async () => {
    const { container } = await mount("/plans")
    for (const p of PLANS) {
      const text = card(container, p.id).textContent!
      expect(text.match(THROTTLE_RE), p.id).toEqual([throttleText(p)])
      expect(text.includes(DISCOUNT_CHIP), `${p.id} 할인 Chip`).toBe(p.discount_months !== null)
    }
  })
  it("필터 칩: 기본 '전체', 누르면 조건에 맞는 카드만 남는다", async () => {
    const { container, getByRole } = await mount("/plans")
    expect(getByRole("button", { name: FILTERS[0].label }).getAttribute("aria-pressed")).toBe("true")
    for (const f of [...FILTERS.slice(1), FILTERS[0]]) {
      fireEvent.click(getByRole("button", { name: f.label }))
      await waitFor(() => expect(cards(container).map((c) => c.dataset.planCard).sort()).toEqual([...f.ids].sort()))
      expect(getByRole("button", { name: f.label }).getAttribute("aria-pressed")).toBe("true")
    }
  })
  it("'자세히'를 누르면 해당 요금제 상세로 이동", async () => {
    const { router, container } = await mount("/plans")
    const p = PLANS[PLANS.length - 1]
    fireEvent.click(within(card(container, p.id)).getByRole("button", { name: "자세히" }))
    await waitFor(() => expect(at(router)).toBe(`/plans/${p.id}`))
  })
})

describe("[G5] 요금제 상세", () => {
  it.each(PLANS.map((p) => [p.id, p] as const))("④ 할인 종료 후 금액·추천 Tag %s", async (id, p) => {
    const { container } = await mount(`/plans/${id}`)
    const { main } = detailParts(container, id)
    const after = priceEls(main!, "after-discount").map((e) => e.textContent!.trim())
    expect(after).toEqual(p.price_after_discount === null ? [] : [afterText(p)])
    expect(container.querySelectorAll('[data-tag="recommended"]')).toHaveLength(p.recommended ? 1 : 0)
    expect(container.textContent!.match(THROTTLE_RE)).toEqual([throttleText(p)])
  })
  it("뒤로 → /plans, '구독 신청하기' → /apply?plan=<id>", async () => {
    const id = PLANS[0].id
    let m = await mount(`/plans/${id}`)
    fireEvent.click(m.getByRole("button", { name: "뒤로" }))
    await waitFor(() => expect(at(m.router)).toBe("/plans"))
    cleanup()
    m = await mount(`/plans/${id}`)
    fireEvent.click(m.getByRole("button", { name: "구독 신청하기" }))
    await waitFor(() => expect(at(m.router)).toBe(`/apply?plan=${id}`))
  })
})

const UNLIMITED_DISCOUNT = PLANS.find((p) => p.price_after_discount !== null) ?? PLANS[0]
async function fillApply(m: Awaited<ReturnType<typeof mount>>, v: { name?: string; phone?: string; agree?: boolean }) {
  if (v.name !== undefined) fireEvent.change(m.getByLabelText("이름"), { target: { value: v.name } })
  if (v.phone !== undefined) fireEvent.change(m.getByLabelText("휴대폰 번호"), { target: { value: v.phone } })
  if (v.agree) fireEvent.click(m.getByRole("checkbox", { name: /개인정보 수집·이용/ }))
  await act(async () => {})
}
const submit = (m: Awaited<ReturnType<typeof mount>>) => m.getByRole("button", { name: "신청하기" }) as HTMLButtonElement

describe("[G5] 구독 신청", () => {
  const path = `/apply?plan=${UNLIMITED_DISCOUNT.id}`
  it("⑥ 조건 3개를 모두 채워야만 '신청하기'가 활성", async () => {
    const m = await mount(path)
    expect(submit(m).disabled, "초기").toBe(true)
    await fillApply(m, { name: FAKE.name })
    expect(submit(m).disabled, "이름만").toBe(true)
    await fillApply(m, { phone: FAKE.phone })
    expect(submit(m).disabled, "동의 없음").toBe(true)
    await fillApply(m, { agree: true })
    expect(submit(m).disabled, "모두 충족").toBe(false)
    await fillApply(m, { phone: FAKE.phone.slice(0, 10) })
    expect(submit(m).disabled, "번호 10자리").toBe(true)
    await fillApply(m, { phone: FAKE.phone, name: "" })
    expect(submit(m).disabled, "이름 비움").toBe(true)
  })
  it("선택한 요금제 요약: 이름·매달 내는 금액·(할인 시) 할인 종료 후 금액", async () => {
    const m = await mount(path)
    const p = UNLIMITED_DISCOUNT
    expect(m.container.textContent).toContain(p.name)
    expect(priceEls(m.container, "monthly").map((e) => e.textContent).join()).toContain(fmt(p.monthly_price))
    if (p.price_after_discount !== null) expect(m.container.textContent).toContain(afterText(p))
  })
  it("뒤로 → 요금제 상세", async () => {
    const m = await mount(path)
    fireEvent.click(m.getByRole("button", { name: "뒤로" }))
    await waitFor(() => expect(at(m.router)).toBe(`/plans/${UNLIMITED_DISCOUNT.id}`))
  })
  it("⑦ 신청 완료 화면의 요금제 이름·매달 내는 금액 = 신청한 요금제", async () => {
    const p = UNLIMITED_DISCOUNT
    const m = await mount(`/apply?plan=${p.id}`)
    await fillApply(m, { name: FAKE.name, phone: FAKE.phone, agree: true })
    fireEvent.click(submit(m))
    await waitFor(() => expect(at(m.router)).toBe("/complete"))
    await act(async () => {})
    expect(m.container.textContent).toContain(DONE_TEXT)
    expect(m.container.textContent).toContain(p.name)
    expect(priceEls(m.container, "monthly").map((e) => e.textContent).join()).toContain(fmt(p.monthly_price))
    expect(m.container.textContent).toContain(FAKE.name)
    fireEvent.click(m.getByRole("button", { name: "요금제 더 보기" }))
    await waitFor(() => expect(at(m.router)).toBe("/plans"))
  })
  it("완료 화면 뒤로 → /plans", async () => {
    const m = await mount(`/apply?plan=${PLANS[0].id}`)
    await fillApply(m, { name: FAKE.name, phone: FAKE.phone, agree: true })
    fireEvent.click(submit(m))
    await waitFor(() => expect(at(m.router)).toBe("/complete"))
    fireEvent.click(m.getByRole("button", { name: "뒤로" }))
    await waitFor(() => expect(at(m.router)).toBe("/plans"))
  })
})

// ---------- G6 인라인 예외 ----------
const screensSrc = () => {
  const dir = join(ROOT, "app/src/screens")
  return existsSync(dir) ? readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8")).join("\n") : ""
}
describe("[G6] 인라인 예외", () => {
  it("없는 요금제 id → /plans", async () => {
    const m = await mount("/plans/__none__")
    await waitFor(() => expect(at(m.router)).toBe("/plans"))
  })
  it("신청 내역 없이 /complete → /plans", async () => {
    const m = await mount("/complete")
    await waitFor(() => expect(at(m.router)).toBe("/plans"))
  })
  it("입력란을 벗어나면 PRD 오류 문구가 그대로 보인다", async () => {
    const m = await mount(`/apply?plan=${PLANS[0].id}`)
    fireEvent.blur(m.getByLabelText("이름"))
    fireEvent.change(m.getByLabelText("휴대폰 번호"), { target: { value: "0100" } })
    fireEvent.blur(m.getByLabelText("휴대폰 번호"))
    fireEvent.blur(m.getByRole("checkbox", { name: /개인정보 수집·이용/ }))
    await act(async () => {})
    for (const msg of [ERR_NAME, ERR_PHONE, ERR_PRIVACY]) expect(m.container.textContent).toContain(msg)
  })
  it("저장 실패·빈 필터 결과 문구가 화면 코드에 원문 그대로 있다", () => {
    const src = screensSrc()
    expect(src).toContain(ERR_SAVE)
    expect(src).toContain(EMPTY_FILTER)
  })
})
