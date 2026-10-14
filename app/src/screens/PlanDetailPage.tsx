import { Navigate, useNavigate, useParams } from "react-router"
import { Header } from "../components/Header"
import { Tag } from "../components/Tag"
import { CardPrice } from "../components/CardPrice"
import { ListRow } from "../components/ListRow"
import { BottomCTA } from "../components/BottomCTA"
import { Button } from "../components/Button"
import { findPlan } from "./plans"
import { afterDiscountText, formatWon, throttleText } from "./content"

export function PlanDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const plan = findPlan(id)
  if (!plan) return <Navigate to="/plans" replace />

  const after = afterDiscountText(plan)

  return (
    <div className="mx-auto flex w-full flex-col bg-bg-surface">
      <Header title="요금제 상세" onBack={() => navigate("/plans")} />
      <main className="w-full pb-80">
        <div data-plan-detail={plan.id} className="flex w-full flex-col gap-16 px-16 pt-8 pb-80">
          <div className="flex w-full flex-col gap-8">
            {plan.recommended ? <Tag variant="recommended" label="추천" /> : null}
            <h1 className="text-heading-h3 text-text-primary">{plan.name}</h1>
            <p className="text-body-small-medium text-text-secondary">{plan.description}</p>
          </div>
          <CardPrice
            label="매달 내는 금액"
            value={formatWon(plan.monthly_price)}
            desc={after && plan.discount_months !== null ? `${plan.discount_months}개월 할인 후 ` : undefined}
            afterDiscount={after ?? undefined}
            className="w-full"
          />
          <div className="flex w-full flex-col">
            <ListRow label="데이터" value={plan.data} className="w-full" />
            <ListRow label="소진 후 속도" value={<span data-throttle="">{throttleText(plan)}</span>} className="w-full" />
          </div>
        </div>
      </main>
      <BottomCTA layout="price" amountLabel="매달 내는 금액" amount={formatWon(plan.monthly_price)}>
        <Button variant="Primary" size="xl" fullWidth onClick={() => navigate(`/apply?plan=${plan.id}`)}>
          구독 신청하기
        </Button>
      </BottomCTA>
    </div>
  )
}
