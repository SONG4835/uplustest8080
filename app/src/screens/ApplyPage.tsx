import { useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import { Header } from "../components/Header"
import { ListRow } from "../components/ListRow"
import { Input } from "../components/Input"
import { Checkbox } from "../components/Checkbox"
import { BottomCTA } from "../components/BottomCTA"
import { Button } from "../components/Button"
import { findPlan } from "./plans"
import { afterDiscountText, copy, formatWon } from "./content"
import { saveSubscription } from "./subscription"

const PHONE_RE = /^\d{11}$/

export function ApplyPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = findPlan(params.get("plan"))

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [touched, setTouched] = useState({ name: false, phone: false, privacy: false })
  const [saveError, setSaveError] = useState(false)

  if (!plan) return <Navigate to="/plans" replace />

  const nameOk = name.trim() !== ""
  const phoneOk = PHONE_RE.test(phone)
  const valid = nameOk && phoneOk && agreed
  const after = afterDiscountText(plan)
  const toDetail = () => navigate(`/plans/${plan.id}`)

  const submit = () => {
    if (!valid) return
    try {
      saveSubscription({
        name: name.trim(),
        phone,
        plan_id: plan.id,
        monthly_price: plan.monthly_price,
        agreed_privacy: agreed,
      })
    } catch {
      setSaveError(true)
      return
    }
    navigate("/complete")
  }

  return (
    <div className="mx-auto flex w-full flex-col bg-bg-surface">
      <Header title="구독 신청" onBack={toDetail} />
      <main className="flex w-full flex-col gap-24 px-16 pt-8 pb-80">
        <div className="flex w-full flex-col rounded-16 bg-bg-subtle px-16">
          <ListRow label="요금제" value={plan.name} className="w-full" />
          <ListRow
            label="매달 내는 금액"
            value={<span data-price="monthly">{formatWon(plan.monthly_price)}</span>}
            className="w-full"
          />
          {after ? (
            <ListRow label="할인 종료 후 금액" value={<span data-price="after-discount">{after}</span>} className="w-full" />
          ) : null}
        </div>
        <form
          noValidate
          className="flex w-full flex-col gap-16 pb-80"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Input
            label="이름"
            value={name}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            errorMessage={touched.name && !nameOk ? copy.errors.name : undefined}
            className="w-full"
          />
          <Input
            label="휴대폰 번호"
            value={phone}
            inputMode="numeric"
            autoComplete="off"
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            errorMessage={touched.phone && !phoneOk ? copy.errors.phone : undefined}
            className="w-full"
          />
          <Checkbox
            label="개인정보 수집·이용 동의"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            onBlur={() => setTouched((t) => ({ ...t, privacy: true }))}
            errorMessage={touched.privacy && !agreed ? copy.errors.privacy : undefined}
          />
          {saveError ? (
            <p role="alert" className="text-caption-medium text-text-error">
              {copy.errors.save}
            </p>
          ) : null}
        </form>
      </main>
      <BottomCTA layout="double">
        <Button variant="Secondary" size="xl" fullWidth onClick={toDetail}>
          취소
        </Button>
        <Button variant="Primary" size="xl" fullWidth disabled={!valid} onClick={submit}>
          신청하기
        </Button>
      </BottomCTA>
    </div>
  )
}
