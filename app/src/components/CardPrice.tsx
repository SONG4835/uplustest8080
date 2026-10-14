import type { ReactNode } from "react"

export type CardPriceProps = {
  label: ReactNode
  /** 강조 값(매달 내는 금액). data-price="monthly" span으로 감싼다. */
  value: ReactNode
  /** 보조 설명 앞부분 (예: 할인 기간 안내) */
  desc?: ReactNode
  /** 할인 종료 후 금액. 있을 때만 data-price="after-discount" span으로 desc 뒤에 붙인다. */
  afterDiscount?: ReactNode
  className?: string
}

export function CardPrice({ label, value, desc, afterDiscount, className }: CardPriceProps) {
  const hasAfter = afterDiscount !== undefined && afterDiscount !== null && afterDiscount !== ""
  return (
    <section
      className={["flex min-h-[124px] w-full max-w-[358px] flex-col justify-center gap-4 rounded-16 bg-bg-subtle p-20", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-body-small-medium text-text-secondary">{label}</span>
      <span data-price="monthly" className="text-heading-h3 text-text-primary">
        {value}
      </span>
      {desc || hasAfter ? (
        <p className="text-body-small-medium text-text-tertiary">
          {desc}
          {hasAfter ? <span data-price="after-discount">{afterDiscount}</span> : null}
        </p>
      ) : null}
    </section>
  )
}
