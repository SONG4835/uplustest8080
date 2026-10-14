export type Subscription = {
  id: string
  name: string
  phone: string
  plan_id: string
  monthly_price: number
  agreed_privacy: boolean
  created_at: string
}

const KEY = "subscription"

/** 신청 1건을 sessionStorage에 저장한다. 실패하면 예외를 던진다. */
export function saveSubscription(input: Omit<Subscription, "id" | "created_at">): Subscription {
  const now = new Date()
  const sub: Subscription = {
    id: `SUB-${now.getTime().toString(36).toUpperCase()}`,
    ...input,
    created_at: now.toISOString(),
  }
  window.sessionStorage.setItem(KEY, JSON.stringify(sub))
  return sub
}

export function loadSubscription(): Subscription | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Subscription>
    if (typeof v.id !== "string" || typeof v.plan_id !== "string" || typeof v.name !== "string") return null
    if (typeof v.monthly_price !== "number" || typeof v.created_at !== "string") return null
    return v as Subscription
  } catch {
    return null
  }
}
