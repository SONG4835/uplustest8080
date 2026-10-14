import { useState } from "react"
import { useNavigate } from "react-router"
import { Header } from "../components/Header"
import { FilterChip } from "../components/FilterChip"
import { CardPlan } from "../components/CardPlan"
import { Tag } from "../components/Tag"
import { Chip } from "../components/Chip"
import { Button } from "../components/Button"
import { plans } from "./plans"
import { afterDiscountText, copy, discountChipText, filters, formatWon, throttleText } from "./content"

const ALL = filters[0].label
const byPrice = [...plans].sort((a, b) => a.monthly_price - b.monthly_price)

export function PlansPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string>(ALL)

  const ids = (filters.find((f) => f.label === selected) ?? filters[0]).plan_ids
  const visible = byPrice.filter((p) => ids.includes(p.id))

  return (
    <div className="mx-auto flex w-full flex-col bg-bg-surface">
      <Header type="root" title="요금제" />
      <main className="flex w-full flex-col gap-16 pb-40">
        <div role="group" aria-label="요금제 필터" className="flex w-full gap-8 overflow-x-auto px-16 pt-8">
          {filters.map((f) => (
            <FilterChip key={f.label} label={f.label} selected={selected === f.label} onClick={() => setSelected(f.label)} />
          ))}
        </div>
        <div className="flex w-full flex-col gap-16 px-16">
          {visible.length === 0 ? (
            <div className="flex w-full flex-col items-center gap-16 py-40">
              <p className="text-body-medium text-text-secondary">{copy.emptyFilter}</p>
              <Button variant="Secondary" size="lg" onClick={() => setSelected(ALL)}>
                {`${ALL} 보기`}
              </Button>
            </div>
          ) : (
            visible.map((p) => {
              const chip = discountChipText(p)
              return (
                <CardPlan
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  desc={p.description}
                  price={formatWon(p.monthly_price)}
                  afterDiscount={afterDiscountText(p) ?? undefined}
                  throttle={throttleText(p)}
                  badge={p.recommended ? <Tag variant="recommended" label="추천" /> : undefined}
                  promo={chip ? <Chip type="sale" label={chip} /> : undefined}
                  onDetail={() => navigate(`/plans/${p.id}`)}
                  className="w-full"
                />
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
