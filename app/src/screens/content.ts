import type { Plan } from "./plans"

// 01-spec.json filters·copy 원문
export const filters: { label: string; plan_ids: string[] }[] = [
  { label: "전체", plan_ids: ["p01", "p02", "p03", "p04"] },
  { label: "50GB 이하", plan_ids: ["p01", "p02"] },
  { label: "100GB 이상", plan_ids: ["p03", "p04"] },
  { label: "속도 제한 없음", plan_ids: ["p04"] },
]

export const copy = {
  errors: {
    name: "이름을 입력해 주세요.",
    phone: "휴대폰 번호 11자리를 숫자로 입력해 주세요.",
    privacy: "개인정보 수집·이용에 동의해야 신청할 수 있어요.",
    save: "신청을 저장하지 못했어요. 다시 시도해 주세요.",
  },
  emptyFilter: "조건에 맞는 요금제가 없어요.",
  complete: "구독 신청이 완료됐어요",
}

export const formatWon = (n: number) => `${n.toLocaleString("ko-KR")}원`

export const throttleText = (p: Plan) => (p.throttle_after ? `소진 후 ${p.throttle_after}로 제한` : "속도 제한 없음")

/** 할인 종료 후 금액 문구. 할인이 없으면 null. */
export const afterDiscountText = (p: Plan) =>
  p.discount_months !== null && p.price_after_discount !== null
    ? `${p.discount_months + 1}개월째부터 ${formatWon(p.price_after_discount)}`
    : null

export const discountChipText = (p: Plan) => (p.discount_months !== null ? `${p.discount_months}개월 할인` : null)
