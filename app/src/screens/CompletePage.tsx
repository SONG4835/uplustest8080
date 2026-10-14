import { useState } from "react"
import { Navigate, useNavigate } from "react-router"
import { Header } from "../components/Header"
import { IconDoneMark } from "../components/IconDoneMark"
import { ListRow } from "../components/ListRow"
import { BottomCTA } from "../components/BottomCTA"
import { Button } from "../components/Button"
import { findPlan } from "./plans"
import { copy, formatWon } from "./content"
import { loadSubscription } from "./subscription"

export function CompletePage() {
  const navigate = useNavigate()
  const [sub] = useState(loadSubscription)
  const plan = findPlan(sub?.plan_id)
  if (!sub || !plan) return <Navigate to="/plans" replace />

  const toPlans = () => navigate("/plans")

  return (
    <div className="mx-auto flex w-full flex-col bg-bg-surface pb-40">
      <Header title="신청 완료" onBack={toPlans} />
      <main className="flex w-full flex-col gap-32 px-16 pt-24 pb-80">
        <div className="flex w-full flex-col items-center gap-16">
          <IconDoneMark />
          <h1 className="text-heading-h3 text-center text-text-primary">{copy.complete}</h1>
        </div>
        <div className="flex w-full flex-col rounded-16 bg-bg-subtle px-16">
          <ListRow label="신청 번호" value={sub.id} className="w-full" />
          <ListRow label="요금제" value={plan.name} className="w-full" />
          <ListRow
            label="매달 내는 금액"
            value={<span data-price="monthly">{formatWon(sub.monthly_price)}</span>}
            className="w-full"
          />
          <ListRow label="신청 일시" value={new Date(sub.created_at).toLocaleString("ko-KR")} className="w-full" />
          <ListRow label="신청자" value={sub.name} className="w-full" />
        </div>
      </main>
      <BottomCTA layout="single">
        <Button variant="Primary" size="xl" fullWidth onClick={toPlans}>
          요금제 더 보기
        </Button>
      </BottomCTA>
    </div>
  )
}
