import type { MouseEventHandler, ReactNode } from "react"
import { Button } from "./Button"
import { IconCheck } from "./IconCheck"

export type CardPlanState = "default" | "selected"

export type CardPlanProps = {
  /** data-plan-card 값 (예: p01) */
  id: string
  name: ReactNode
  desc?: ReactNode
  /** 매달 내는 금액. data-price="monthly" span으로 감싼다. */
  price: ReactNode
  /** 할인 종료 후 금액 (Discount). 있을 때만 data-price="after-discount" span으로 표시한다. */
  afterDiscount?: ReactNode
  /** 소진 후 속도 문구. 있을 때만 data-throttle span으로 표시한다. */
  throttle?: ReactNode
  /** Badge 슬롯 (Tag) */
  badge?: ReactNode
  /** Promo 슬롯 (Chip) */
  promo?: ReactNode
  state?: CardPlanState
  /** '자세히' 버튼 */
  onDetail?: MouseEventHandler<HTMLButtonElement>
  detailLabel?: ReactNode
  children?: ReactNode
  className?: string
}

const has = (v: ReactNode) => v !== undefined && v !== null && v !== false && v !== ""

export function CardPlan({
  id,
  name,
  desc,
  price,
  afterDiscount,
  throttle,
  badge,
  promo,
  state = "default",
  onDetail,
  detailLabel = "자세히",
  children,
  className,
}: CardPlanProps) {
  const selected = state === "selected"
  return (
    <article
      data-plan-card={id}
      aria-current={selected ? "true" : undefined}
      className={[
        "flex w-full max-w-[358px] flex-col gap-16 rounded-20 border bg-bg-surface p-20",
        selected ? "min-h-[224px] border-border-focus" : "min-h-[223px] border-border-default",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-8">
        {has(badge) || has(promo) || selected ? (
          <div className="flex items-center gap-4">
            {badge}
            {promo}
            {selected ? <IconCheck className="ml-auto text-icon-accent" /> : null}
          </div>
        ) : null}
        <h2 className="text-subtitle-bold text-text-primary">{name}</h2>
        {has(desc) ? <p className="text-body-small-medium text-text-secondary">{desc}</p> : null}
        {has(throttle) ? (
          <span data-throttle="" className="text-caption-medium text-text-tertiary">
            {throttle}
          </span>
        ) : null}
      </div>
      {children}
      <div className="mt-auto flex items-end justify-between gap-12">
        <div className="flex min-w-0 flex-col gap-4">
          <span data-price="monthly" className="text-heading-h4 text-text-primary">
            {price}
          </span>
          {has(afterDiscount) ? (
            <span data-price="after-discount" className="text-caption-medium text-text-tertiary">
              {afterDiscount}
            </span>
          ) : null}
        </div>
        <Button variant="Secondary" size="sm" onClick={onDetail}>
          {detailLabel}
        </Button>
      </div>
    </article>
  )
}
