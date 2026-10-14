import { useEffect, useState } from "react"
import { supabase } from "./supabase"

/** public.subscriptions 컬럼 */
export type Subscription = {
  id: string
  subscription_no: string
  plan_id: string
  plan_name: string
  monthly_price: number
  name: string
  phone: string
  agreed_privacy: boolean
  agreed_at: string
  status: string
  created_at: string
}

export type SubscriptionInput = Pick<
  Subscription,
  "plan_id" | "plan_name" | "monthly_price" | "name" | "phone" | "agreed_privacy"
>

const NO_KEY = "subscription_no"
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/** `SUB-` + 대문자 영숫자 10자리 */
export function createSubscriptionNo(): string {
  // 252 = 36 × 7 — 그 이상 바이트는 버려 편향을 없앤다
  let out = ""
  const bytes = new Uint8Array(16)
  while (out.length < 10) {
    crypto.getRandomValues(bytes)
    for (const b of bytes) {
      if (b < 252 && out.length < 10) out += ALPHABET[b % ALPHABET.length]
    }
  }
  return `SUB-${out}`
}

/** 신청 1건을 저장하고 신청 번호를 돌려준다. 실패하면 예외를 던진다. */
export async function saveSubscription(input: SubscriptionInput): Promise<string> {
  if (!supabase) throw new Error("supabase unavailable")
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ ...input, subscription_no: createSubscriptionNo() })
    .select("subscription_no")
    .single()
  if (error || !data || String(data.subscription_no) !== data.subscription_no) throw error ?? new Error("no data")
  return data.subscription_no
}

/** 신청 번호 1건을 읽는다. 없거나 실패하면 null. */
export async function loadSubscription(no: string): Promise<Subscription | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, subscription_no, plan_id, plan_name, monthly_price, name, phone, agreed_privacy, agreed_at, status, created_at")
      .eq("subscription_no", no)
      .maybeSingle()
    if (error || !data) return null
    return data as Subscription
  } catch {
    return null
  }
}

/** 새로고침 대비: 신청 번호만 저장한다(개인정보 저장 안 함). */
export function rememberSubscriptionNo(no: string) {
  try {
    window.sessionStorage.setItem(NO_KEY, no)
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function recallSubscriptionNo(): string | null {
  try {
    return window.sessionStorage.getItem(NO_KEY)
  } catch {
    return null
  }
}

/** 라우터 state에서 신청 번호를 꺼낸다. 없으면 null. */
export function subscriptionNoFromState(state: unknown): string | null {
  const v = (state as { no?: unknown } | null | undefined)?.no
  return String(v) === v && v !== "" ? (v as string) : null
}

type LoadedSubscription = { no: string; sub: Subscription | null }

/** 신청 번호 1건 조회 훅. 조회가 끝나기 전에는 loading=true. */
export function useSubscription(no: string | null): { loading: boolean; sub: Subscription | null } {
  const [loaded, setLoaded] = useState<LoadedSubscription | null>(null)

  useEffect(() => {
    if (!no) return
    let cancelled = false
    void loadSubscription(no).then((sub) => {
      if (!cancelled) setLoaded({ no, sub })
    })
    return () => {
      cancelled = true
    }
  }, [no])

  if (!no) return { loading: false, sub: null }
  if (!loaded || loaded.no !== no) return { loading: true, sub: null }
  return { loading: false, sub: loaded.sub }
}

/** 이름 가운데 가림: 1자 그대로, 2자 "가*", 3자 이상 첫·끝만 남김 */
export function maskName(name: string): string {
  const chars = Array.from(name)
  if (chars.length <= 1) return name
  if (chars.length === 2) return `${chars[0]}*`
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`
}

/** 휴대폰 번호 가운데 4자리 가림: 010-****-0000 형식 */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "")
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`
  return "*".repeat(d.length)
}
