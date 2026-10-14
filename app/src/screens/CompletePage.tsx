import { Navigate, useLocation, useNavigate } from "react-router"
import { Header } from "../components/Header"
import { IconDoneMark } from "../components/IconDoneMark"
import { ListRow } from "../components/ListRow"
import { BottomCTA } from "../components/BottomCTA"
import { Button } from "../components/Button"
import { copy, formatWon } from "./content"
import { maskName, maskPhone, recallSubscriptionNo, subscriptionNoFromState, useSubscription } from "./subscription"

export function CompletePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const no = subscriptionNoFromState(location.state) ?? recallSubscriptionNo()
  const { loading, sub } = useSubscription(no)

  if (!no) return <Navigate to="/plans" replace />
  // 로딩 중: 별도 상태 화면 없이 내용 없이 렌더
  if (loading) return null
  if (!sub) return <Navigate to="/plans" replace />

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
          <ListRow label="신청 번호" value={sub.subscription_no} className="w-full" />
          <ListRow label="요금제" value={sub.plan_name} className="w-full" />
          <ListRow
            label="매달 내는 금액"
            value={<span data-price="monthly">{formatWon(sub.monthly_price)}</span>}
            className="w-full"
          />
          <ListRow label="신청 일시" value={new Date(sub.created_at).toLocaleString("ko-KR")} className="w-full" />
          <ListRow label="신청자" value={maskName(sub.name)} className="w-full" />
          <ListRow label="휴대폰 번호" value={maskPhone(sub.phone)} className="w-full" />
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
